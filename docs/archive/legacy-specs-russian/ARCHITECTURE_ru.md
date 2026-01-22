# DSL Identity — Architecture

## Архитектура системы идентификации DOM-элементов

**Версия**: 1.0  
**Дата**: 2025-01-15  
**Статус**: Draft

---

## Оглавление

1. [Обзор системы](#обзор-системы)
2. [Компоненты](#компоненты)
3. [Потоки данных](#потоки-данных)
4. [Модульная структура](#модульная-структура)
5. [API Design](#api-design)
6. [Интеграция с rrweb](#интеграция-с-rrweb)
7. [Типы и интерфейсы](#типы-и-интерфейсы)

---

## Обзор системы

### High-level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    DOM Tree                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              DSL Generator (Recording)                │  │
│  │  • Anchor Finder                                      │  │
│  │  • Path Builder                                       │  │
│  │  • Semantic Extractor                                 │  │
│  │  • SVG Fingerprinter                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  DSL Identity (JSON)                  │  │
│  │  { anchor, path, target, constraints, meta }          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐               │
│         ▼                                   ▼               │
│  ┌─────────────┐                    ┌─────────────┐        │
│  │  Analytics  │                    │   rrweb     │        │
│  │   Storage   │                    │  Recorder   │        │
│  └─────────────┘                    └─────────────┘        │
│         │                                   │               │
└─────────┼───────────────────────────────────┼───────────────┘
          │                                   │
          ▼                                   ▼
   ┌─────────────┐                    ┌─────────────┐
   │  Analytics  │                    │   Player    │
   │  Pipeline   │                    │   (Replay)  │
   └─────────────┘                    └─────────────┘
          │                                   │
          │                                   ▼
          │                            ┌─────────────┐
          │                            │  Resolver   │
          │                            │  DSL → DOM  │
          │                            └─────────────┘
          │                                   │
          └───────────────┬───────────────────┘
                          ▼
                   ┌─────────────┐
                   │   Heatmap   │
                   │ Correlation │
                   └─────────────┘
```

---

## Компоненты

### 1. DSL Generator (Core)

**Ответственность**: Генерация DSL identity из DOM-элемента

**Входы**:

- `target: Element` — целевой DOM-элемент
- `options: GeneratorOptions` — настройки генерации

**Выходы**:

- `DslIdentity` — JSON объект с DSL
- `null` — если генерация невозможна

**Подкомпоненты**:

#### 1.1 Anchor Finder

```typescript
class AnchorFinder {
  /**
   * Finds semantic anchor for element
   * @returns Anchor node or null if not found
   */
  findAnchor(element: Element, maxDepth: number = 10): AnchorNode | null;

  /**
   * Scores anchor candidate
   */
  scoreAnchor(element: Element): number;
}
```

**Алгоритм**:

1. Traverse up from element
2. Score each candidate (Tier A/B/C)
3. Stop at semantic element or maxDepth
4. Return best scored or fallback

#### 1.2 Path Builder

```typescript
class PathBuilder {
  /**
   * Builds semantic path from anchor to target
   */
  buildPath(anchor: Element, target: Element, options: PathOptions): PathNode[];

  /**
   * Checks if element should be included in path
   */
  shouldInclude(element: Element): boolean;

  /**
   * Checks uniqueness of current path
   */
  checkUniqueness(path: PathNode[], dom: Document): boolean;
}
```

**Алгоритм**:

1. Traverse target → anchor
2. Filter noise elements
3. Check uniqueness
4. Add pads if needed for disambiguation
5. Invert path (anchor → target)

#### 1.3 Semantic Extractor

```typescript
class SemanticExtractor {
  /**
   * Extracts semantic features from element
   */
  extract(element: Element): DslSemantics;

  /**
   * Filters semantic vs utility classes
   */
  filterClasses(classes: string[]): {
    semantic: string[];
    utility: string[];
  };

  /**
   * Normalizes text content
   */
  normalizeText(text: string): {
    raw: string;
    normalized: string;
  };

  /**
   * Extracts attributes with stability filtering (v1.0.3)
   * Excludes state attributes, library-generated attributes
   */
  extractAttributes(element: Element): Record<string, string>;
}
```

**Фильтрация атрибутов (v1.0.3):**

`SemanticExtractor` использует модуль `attribute-filters` для отделения стабильных атрибутов идентичности от временных атрибутов состояния:

```typescript
import { isStableAttribute } from '../utils/attribute-filters';

// В extractAttributes()
for (const attr of element.attributes) {
  // Фильтр состояния и библиотечных атрибутов
  if (!isStableAttribute(attr.name, attr.value)) continue;

  // Только стабильные атрибуты попадают в DSL
  attrs[attr.name] = attr.value;
}
```

**Критерии стабильности:**

- ✅ ARIA семантика: `aria-label`, `aria-labelledby`, `role`
- ❌ ARIA состояние: `aria-selected`, `aria-expanded`, `aria-hidden`
- ✅ HTML семантика: `name`, `type`, `placeholder`, `href`
- ❌ HTML состояние: `disabled`, `checked`, `value`
- ✅ Test ID: `data-testid`, `data-cy`, `data-*-id`
- ❌ Library state: `data-radix-*`, `data-state`, `data-orientation`
- ✅ Stable IDs: пользовательские ID
- ❌ Generated IDs: `radix-:ru:-*`, `headlessui-*`, `mui-*`

#### 1.4 SVG Fingerprinter

```typescript
class SvgFingerprinter {
  /**
   * Generates fingerprint for SVG element
   */
  fingerprint(element: SVGElement): SvgFingerprint;

  /**
   * Computes hash for path data
   */
  computePathHash(d: string): string;

  /**
   * Detects animations
   */
  hasAnimation(element: SVGElement): boolean;
}
```

---

### 2. DSL Resolver

**Ответственность**: Резолв DSL identity обратно в DOM-элемент

**Входы**:

- `dsl: DslIdentity` — DSL объект
- `dom: Document | INode` — корень DOM (native или rrdom)

**Выходы**:

- `ResolveResult` — результат с элементами, статусом, warnings

**Подкомпоненты**:

#### 2.1 CSS Builder

```typescript
class CssBuilder {
  /**
   * Builds CSS selector from DSL
   */
  buildSelector(dsl: DslIdentity): string;
}
```

#### 2.2 Semantics Matcher

```typescript
class SemanticsMatcher {
  /**
   * Filters elements by semantic criteria
   */
  match(elements: Element[], semantics: DslSemantics): Element[];

  /**
   * Matches text content
   */
  matchText(element: Element, text: TextContent): boolean;

  /**
   * Matches attributes
   */
  matchAttributes(element: Element, attrs: Record<string, string>): boolean;

  /**
   * Matches SVG fingerprint
   */
  matchSvgFingerprint(element: SVGElement, fingerprint: SvgFingerprint): boolean;
}
```

#### 2.3 Constraint Processor

```typescript
class ConstraintProcessor {
  /**
   * Applies constraints to candidates
   */
  applyConstraints(candidates: Element[], constraints: Constraint[]): Element[];

  /**
   * Applies single constraint
   */
  applyConstraint(candidates: Element[], constraint: Constraint): Element[];
}
```

#### 2.4 Fallback Handler

```typescript
class FallbackHandler {
  /**
   * Handles resolution fallback
   */
  handleFallback(dsl: DslIdentity, dom: Document): ResolveResult;
}
```

---

### 3. Utilities

#### 3.1 Attribute Filters (v1.0.3)

```typescript
/**
 * Фильтрация атрибутов по стабильности
 * Отделяет атрибуты идентичности от атрибутов состояния
 */
function isStableAttribute(name: string, value: string): boolean;

// Константы классификации
const ARIA_STABLE_ATTRIBUTES: string[]; // aria-label, role, etc.
const ARIA_STATE_ATTRIBUTES: string[]; // aria-selected, aria-expanded
const DATA_STATE_ATTRIBUTES: string[]; // data-state, data-active
const LIBRARY_DATA_PREFIXES: string[]; // data-radix-, data-headlessui-
const DATA_ID_PATTERNS: string[]; // data-testid, data-cy, data-*-id
const HTML_STABLE_ATTRIBUTES: string[]; // name, type, placeholder
const HTML_STATE_ATTRIBUTES: string[]; // disabled, checked, value
const GENERATED_ID_PATTERNS: RegExp[]; // /^radix-/, /^headlessui-/
```

**Назначение:**

- Обеспечивает стабильность EID при изменении состояния элемента
- Исключает библиотечные сгенерированные атрибуты
- Фильтрует динамические ID от UI фреймворков

**Философия:**

> SEQL идентифицирует элементы по их **семантической идентичности**,
> а не по **текущему состоянию**. Элемент остается тем же элементом,
> независимо от того, активен он или нет, виден или скрыт.

#### 3.2 Scoring

```typescript
class Scorer {
  /**
   * Calculates confidence score
   */
  calculateConfidence(dsl: DslIdentity): number;

  /**
   * Scores node
   */
  scoreNode(element: Element, semantics: DslSemantics): number;
}
```

#### 3.3 Validation

```typescript
class DslValidator {
  /**
   * Validates DSL structure
   */
  validate(dsl: DslIdentity): ValidationResult;

  /**
   * Validates node
   */
  validateNode(node: DslNode): boolean;
}
```

---

## Потоки данных

### Recording Flow

```
User Interaction (click/input/focus)
    │
    ▼
event.target (DOM Element)
    │
    ▼
┌───────────────────┐
│  Anchor Finder    │ → finds semantic anchor
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Path Builder     │ → builds semantic path
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Semantic Extract  │ → extracts features (text, attrs, classes)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ SVG Fingerprint   │ → generates fingerprint if SVG
│  (conditional)    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   DSL Identity    │ → JSON serialization
│   (complete)      │
└────────┬──────────┘
         │
         ├──→ rrweb event.data.dslIdentity
         │
         └──→ analytics storage
```

### Replay Flow

```
rrweb event with dslIdentity
    │
    ▼
┌───────────────────┐
│   CSS Builder     │ → builds CSS selector from anchor + path
└────────┬──────────┘
         │
         ▼
document.querySelectorAll(selector)
    │
    ▼
┌───────────────────┐
│ Semantics Matcher │ → filters by text/attrs/svg
└────────┬──────────┘
         │
         ▼
candidates.length check
    │
    ├──→ 1 element? → SUCCESS
    │
    ├──→ 0 elements? → FALLBACK
    │
    └──→ >1 elements? ─┐
                       ▼
         ┌───────────────────┐
         │ Constraint Apply  │ → applies uniqueness/visibility/position
         └────────┬──────────┘
                  │
                  ▼
         ┌───────────────────┐
         │ Result (success/  │
         │ ambiguous/error)  │
         └───────────────────┘
```

### Analytics Flow

```
Multiple sessions with DSL identities
    │
    ▼
┌───────────────────┐
│  Hash DSL         │ → stable element ID
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Group by hash    │ → aggregate clicks/events
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Fuzzy Match      │ → match across releases (confidence threshold)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Heatmap / Stats  │
└───────────────────┘
```

---

## Модульная структура

### Рекомендуемая структура проекта

```
dsl-identity/
├── src/
│   ├── generator/
│   │   ├── index.ts              # Public API
│   │   ├── AnchorFinder.ts
│   │   ├── PathBuilder.ts
│   │   ├── SemanticExtractor.ts
│   │   └── SvgFingerprinter.ts
│   │
│   ├── resolver/
│   │   ├── index.ts              # Public API
│   │   ├── CssBuilder.ts
│   │   ├── SemanticsMatcher.ts
│   │   ├── ConstraintProcessor.ts
│   │   └── FallbackHandler.ts
│   │
│   ├── utils/
│   │   ├── attribute-filters.ts   # v1.0.3: Attribute stability filtering
│   │   ├── Scorer.ts
│   │   ├── Validator.ts
│   │   ├── TextNormalizer.ts
│   │   └── ClassFilter.ts
│   │
│   ├── types/
│   │   ├── DslIdentity.ts        # Core types
│   │   ├── Nodes.ts              # Node types
│   │   ├── Options.ts            # Configuration
│   │   └── Results.ts            # Result types
│   │
│   ├── integrations/
│   │   ├── rrweb/
│   │   │   ├── RecorderPlugin.ts
│   │   │   └── PlayerPlugin.ts
│   │   │
│   │   └── analytics/
│   │       └── Aggregator.ts
│   │
│   └── index.ts                  # Main export
│
├── tests/
│   ├── unit/
│   │   ├── generator/
│   │   ├── resolver/
│   │   └── utils/
│   │
│   ├── integration/
│   │   └── end-to-end.test.ts
│   │
│   └── fixtures/
│       ├── html/
│       └── dsl/
│
├── docs/
│   ├── SPECIFICATION.md
│   ├── REQUIREMENTS.md
│   ├── DECISIONS.md
│   ├── ARCHITECTURE.md          # Этот файл
│   └── AI_AGENT_INSTRUCTIONS.md
│
├── examples/
│   ├── basic-usage.ts
│   ├── rrweb-integration.ts
│   └── analytics-pipeline.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## API Design

### Generator API

```typescript
import { generateDsl } from 'dsl-identity';

// Basic usage
const dsl = generateDsl(element);

// With options
const dsl = generateDsl(element, {
  maxPathDepth: 10,
  enableSvgFingerprint: true,
  confidenceThreshold: 0.6,
  fallbackToBody: true,
});

// Result
if (dsl) {
  console.log(dsl.meta.confidence); // 0.93
  console.log(JSON.stringify(dsl));
}
```

### Resolver API

```typescript
import { resolveDsl } from 'dsl-identity';

// Basic usage
const result = resolveDsl(dsl, document);

// Check result
if (result.status === 'success') {
  const element = result.elements[0];
  highlightElement(element);
}

if (result.status === 'ambiguous') {
  console.warn('Multiple matches:', result.elements);
}

// With options
const result = resolveDsl(dsl, document, {
  strictMode: false,
  enableFallback: true,
  maxCandidates: 20,
});
```

### rrweb Integration

```typescript
import rrweb from 'rrweb';
import { RrwebDslPlugin } from 'dsl-identity/integrations/rrweb';

// Recorder with DSL plugin
const stopFn = rrweb.record({
  emit(event) {
    // event.data.dslIdentity available for interactions
    if (event.data?.dslIdentity) {
      console.log('DSL:', event.data.dslIdentity);
    }
  },
  plugins: [
    new RrwebDslPlugin({
      enableSvgFingerprint: true,
    }),
  ],
});

// Player with DSL resolver
const replayer = new rrweb.Replayer(events, {
  plugins: [
    new RrwebDslResolverPlugin({
      onResolve(result) {
        if (result.status === 'success') {
          highlightElement(result.elements[0]);
        }
      },
    }),
  ],
});
```

---

## Интеграция с rrweb

### Recording Integration

```typescript
// В rrweb recorder
function recordInteraction(event: InteractionEvent) {
  const target = event.target;

  // Generate DSL identity
  const dslIdentity = generateDsl(target, {
    maxPathDepth: 10,
    enableSvgFingerprint: true,
  });

  // Attach to rrweb event
  emitEvent({
    type: IncrementalSource.MouseInteraction,
    data: {
      type: event.type,
      id: mirror.getId(target),
      dslIdentity, // ← Added
      x: event.clientX,
      y: event.clientY,
    },
  });
}
```

### Player Integration

```typescript
// В rrweb player
function handleInteraction(event: InteractionData) {
  // Try to resolve by rrweb id first
  let element = mirror.getNode(event.id);

  // Fallback to DSL resolution
  if (!element && event.dslIdentity) {
    const result = resolveDsl(event.dslIdentity, this.iframe.contentDocument);

    if (result.status === 'success') {
      element = result.elements[0];
    }
  }

  if (element) {
    highlightElement(element);
  }
}
```

---

## Типы и интерфейсы

### Core Types

```typescript
/**
 * Main DSL Identity structure
 */
interface DslIdentity {
  version: string;
  anchor: AnchorNode;
  path: PathNode[];
  target: TargetNode;
  constraints: Constraint[];
  fallback: FallbackRules;
  meta: DslMeta;
}

/**
 * Anchor node
 */
interface AnchorNode {
  tag: string;
  semantics: DslSemantics;
  score: number;
  degraded: boolean;
}

/**
 * Path node
 */
interface PathNode {
  tag: string;
  semantics: DslSemantics;
  score: number;
}

/**
 * Target node (same as PathNode but semantically different)
 */
interface TargetNode extends PathNode {
  // Target-specific extensions can go here
}

/**
 * Semantic features
 */
interface DslSemantics {
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  text?: TextContent;
  svg?: SvgFingerprint;
  role?: string;
}

/**
 * Text content
 */
interface TextContent {
  raw: string;
  normalized: string;
}

/**
 * SVG fingerprint
 */
interface SvgFingerprint {
  shape: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon';
  dHash?: string;
  geomHash?: string;
  hasAnimation: boolean;
  role?: string;
  titleText?: string;
}

/**
 * Constraint
 */
interface Constraint {
  type: 'uniqueness' | 'visibility' | 'text-proximity' | 'position';
  params: Record<string, any>;
  priority: number;
}

/**
 * Fallback rules
 */
interface FallbackRules {
  onMultiple: 'allow-multiple' | 'best-score' | 'first';
  onMissing: 'anchor-only' | 'strict' | 'none';
  maxDepth: number;
}

/**
 * DSL metadata
 */
interface DslMeta {
  confidence: number;
  generatedAt: string;
  generator: string;
  source: string;
  degraded: boolean;
  degradationReason?: string;
}
```

### Options Types

```typescript
/**
 * Generator options
 */
interface GeneratorOptions {
  maxPathDepth?: number;
  enableSvgFingerprint?: boolean;
  confidenceThreshold?: number;
  fallbackToBody?: boolean;
  includeUtilityClasses?: boolean;
}

/**
 * Resolver options
 */
interface ResolverOptions {
  strictMode?: boolean;
  enableFallback?: boolean;
  maxCandidates?: number;
}
```

### Result Types

```typescript
/**
 * Resolve result
 */
interface ResolveResult {
  status: 'success' | 'ambiguous' | 'error' | 'degraded-fallback';
  elements: Element[];
  warnings: string[];
  confidence: number;
  meta: {
    degraded: boolean;
    degradationReason?: string;
  };
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## Performance Considerations

### Generator Performance

**Целевые метрики**:

- Время генерации: ≤ 5ms
- Сложность: O(depth), где depth ≤ 10

**Оптимизации**:

1. Early exit при достижении уникальности
2. Кэширование semantic extraction для элементов
3. Lazy SVG fingerprinting (только когда нужно)

### Resolver Performance

**Целевые метрики**:

- Время резолва: ≤ 50ms
- Сложность: O(candidates)

**Оптимизации**:

1. CSS narrowing first (быстрое сужение)
2. Early exit при uniqueness
3. Constraint application только при ambiguity
4. Memoization для repeated resolves

---

## Security & Privacy

### PII Protection

```typescript
class PiiFilter {
  /**
   * Masks sensitive data in text
   */
  maskText(text: string): string {
    // Email: user@example.com → u***@e***.com
    // Phone: +1234567890 → +***
    // Credit card: masked
  }

  /**
   * Checks if attribute contains PII
   */
  isPiiAttribute(name: string): boolean {
    return /email|phone|ssn|credit|password/.test(name);
  }
}
```

### Data Minimization

- Не включать в DSL более чем необходимо для идентификации
- Truncate длинные text content
- Mask PII automatically

---

## Testing Strategy

### Unit Tests

- Каждый компонент изолированно
- Mock DOM для предсказуемости
- Edge cases coverage

### Integration Tests

- Generator → Resolver round-trip
- rrweb integration
- Analytics pipeline

### E2E Tests

- Реальные веб-страницы
- A/B testing scenarios
- Release-to-release stability

---

## Future Extensions

### Возможные улучшения (v2.0+)

1. **Machine Learning scoring** (опционально)
   - Обучение на реальных данных
   - Улучшение confidence calculation

2. **Cross-browser normalization**
   - Учет различий между браузерами
   - Shadow DOM support

3. **Framework-specific hints**
   - React/Vue component names
   - Angular directives

4. **Visual similarity** (опционально)
   - Image hash для визуальной идентификации
   - Layout fingerprint

---

**Статус документа**: Draft  
**Следующий шаг**: Review архитектуры, начало имплементации  
**Владелец**: Artem
