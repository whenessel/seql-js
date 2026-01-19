# Архитектура: EID vs EIQ — Canonical vs Transport

## 📋 ОПРЕДЕЛЕНИЯ

### Element Identity Descriptor (EID)

**Тип**: Structured JSON / AST  
**Назначение**: Canonical format, source of truth  
**Используется**: Внутри библиотеки для всех операций

```typescript
interface ElementIdentityDescriptor {
  version: '1.0';
  anchor: NodeDescriptor;
  path: PathNode[];
  target: NodeDescriptor;
  constraints: Constraint[];
  fallback: FallbackStrategy;
  meta: Metadata;
}
```

### Element Identity Query (EIQ)

**Тип**: Canonical string  
**Назначение**: Transport format, human interface  
**Используется**: Для передачи между системами, хранения, аналитики

```typescript
type ElementIdentityQuery = string;

// Пример
const eiq: ElementIdentityQuery = 
  "footer[.text-card-foreground] > div[.container]#1 > ul#2 > li#3 > svg[.lucide-mail]#1 > rect#1";
```

---

## ✅ АРХИТЕКТУРНОЕ ПРАВИЛО

```
┌─────────────────────────────────────────────────┐
│  EID = Source of Truth (Canonical Format)       │
│  EIQ = Transport Format (String Serialization)  │
└─────────────────────────────────────────────────┘

     EID                    EIQ
      ↓                      ↓
  [JSON/AST]  ←→ stringify → [String]
      ↓                      ↓
  All logic           Between systems
```

### Ключевой принцип

```typescript
// ✅ ПРАВИЛЬНО
EIQ → parse() → EID → resolve() → Element[]

// ❌ НЕПРАВИЛЬНО
EIQ → resolve() → Element[] // NO AST!
```

**EIQ никогда не интерпретируется напрямую.**  
**Всегда через parse → EID → logic.**

---

## 🎯 КЕЙС ИСПОЛЬЗОВАНИЯ

### Pipeline Overview

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│   rrweb     │────▶│  Analytics   │────▶│  Backend      │────▶│   Player   │
│  Recording  │     │  (GA/Custom) │     │  Aggregation  │     │   Replay   │
└─────────────┘     └──────────────┘     └───────────────┘     └────────────┘
     │ EID                │ EIQ                │ EIQ                │ EID
     │ (full)             │ (compact)          │ (grouped)          │ (resolved)
     ▼                    ▼                    ▼                    ▼
```

---

## 📦 ЭТАП 1: rrweb Recording

### Задача
Записать DOM snapshot с идентификаторами элементов для будущего resolve.

### Процесс

```typescript
// В rrweb serializeNode
function serializeNodeWithEID(node: Node): SerializedNode {
  // 1. Генерируем EID (canonical format)
  const eid: ElementIdentityDescriptor = generateEID(node);
  
  // 2. Сериализуем EID в ноду
  const serialized = {
    ...serializeNode(node),
    eid: eid, // ← Полный EID (JSON)
    eiq: stringifyEID(eid) // ← Опционально для инспекции/дебага
  };
  
  return serialized;
}
```

### Результат в rrweb snapshot

```json
{
  "type": 2,
  "tagName": "rect",
  "attributes": { "width": "20", "height": "16" },
  "eid": {
    "version": "1.0",
    "anchor": { "tag": "footer", "semantics": {...} },
    "path": [...],
    "target": { "tag": "rect", "semantics": {...} },
    "meta": { "confidence": 0.45 }
  },
  "eiq": "footer[.text-card-foreground] > ... > rect#1"
}
```

**Важно**:
- EID хранится полностью (source of truth)
- EIQ опционально (для human-readability)

---

## 📊 ЭТАП 2: Analytics Runtime (GA)

### Задача
При клике/вводе отправить идентификатор элемента в аналитику.

### Процесс

```typescript
// В обработчике событий
function trackInteraction(element: Element, eventType: string) {
  // 1. Получаем EID из rrweb snapshot или генерируем заново
  const eid: ElementIdentityDescriptor = getEIDForElement(element);
  
  // 2. Stringify в EIQ (compact format для GA)
  const eiq: ElementIdentityQuery = stringifyEID(eid);
  
  // 3. Отправляем в GA
  gtag('event', eventType, {
    element_identity: eiq, // ← Компактная строка
    timestamp: Date.now(),
    // ... другие метрики
  });
}

// Пример отправляемых данных
{
  event: "click",
  element_identity: "footer > ul > li#3 > svg[.lucide-mail] > rect",
  timestamp: 1706789456789,
  session_id: "abc123"
}
```

**Преимущества EIQ для GA**:
- ✅ Компактнее JSON (лимиты payload)
- ✅ Человекочитаем (легко дебажить в GA UI)
- ✅ Можно использовать как dimension/key
- ✅ GA не нужно знать про DSL структуру

**GA не знает про EID — и не должен.**

---

## 🗄️ ЭТАП 3: Backend Aggregation

### Задача
Агрегировать события по элементам для построения тепловой карты.

### Процесс

```typescript
// Backend агрегация
interface AnalyticsEvent {
  eiq: ElementIdentityQuery; // ← Ключ агрегации
  event_type: string;
  timestamp: number;
  session_id: string;
}

// Группировка по EIQ
const heatmapData = events.reduce((acc, event) => {
  const key = event.eiq; // EIQ как ключ
  
  acc[key] = acc[key] || { count: 0, sessions: new Set() };
  acc[key].count++;
  acc[key].sessions.add(event.session_id);
  
  return acc;
}, {});

// Результат
{
  "footer > ul > li#3 > svg > rect": {
    count: 245,
    sessions: 128,
    avg_time: 1.5
  },
  "button[.btn-primary]": {
    count: 892,
    sessions: 534,
    avg_time: 0.3
  }
}
```

**Backend не резолвит DOM — и не должен.**  
**EIQ = ключ агрегации, не более.**

---

## 🎬 ЭТАП 4: Player Replay

### Задача
Отобразить тепловую карту на воспроизводимом DOM из rrweb snapshot.

### Процесс

```typescript
// В rrweb player
class HeatmapRenderer {
  
  async renderHeatmap(snapshot: RRWebSnapshot, analyticsData: HeatmapData) {
    for (const [eiq, stats] of Object.entries(analyticsData)) {
      
      // 1. Parse EIQ → EID
      const eid: ElementIdentityDescriptor = parseEIQ(eiq);
      
      // 2. Resolve EID в rrdom
      const elements = await resolve(eid, snapshot.dom);
      
      if (elements.length > 0) {
        // 3. Отрисовка тепловой карты
        this.highlightElement(elements[0], {
          intensity: stats.count,
          color: this.getHeatColor(stats.count),
          tooltip: `${stats.count} clicks, ${stats.sessions} sessions`
        });
      }
    }
  }
  
  // Resolve работает ТОЛЬКО с EID
  async resolve(
    eid: ElementIdentityDescriptor, 
    dom: RRDOMSnapshot
  ): Promise<Element[]> {
    // Внутренняя логика resolver
    // Использует EID.anchor, EID.path, EID.target
    // Применяет constraints и fallback
    return resolverEngine.resolve(eid, dom);
  }
}
```

**Критически важно**:
- ✅ EIQ всегда парсится обратно в EID
- ✅ Resolve работает только с EID
- ✅ EIQ никогда не используется напрямую

---

## 🔒 КРИТИЧЕСКИЕ ТРЕБОВАНИЯ К EIQ

Если EIQ становится transport-ключом в аналитике, он должен быть:

### 1. Детерминированным

```typescript
// Один и тот же EID всегда дает один и тот же EIQ
const eid1 = generateEID(element);
const eid2 = generateEID(element);

stringifyEID(eid1) === stringifyEID(eid2); // ✅ ВСЕГДА true
```

### 2. Каноничным

```typescript
// Один EID → один EIQ (нет альтернативных представлений)

// ❌ НЕПРАВИЛЬНО (два варианта для одного EID)
"footer > ul > li#3"
"footer>ul>li#3"

// ✅ ПРАВИЛЬНО (только один канонический формат)
"footer > ul > li#3"
```

### 3. Версионированным

```typescript
// EIQ должен содержать версию протокола
const eiq = "v1:footer > ul > li#3";
//           ↑↑
//           версия

// При изменении формата версия меняется
const eiq_v2 = "v2:footer[role=contentinfo] > ul > li:nth(3)";
```

### 4. Stable-sorted

```typescript
// Атрибуты и классы в стабильном порядке
"div[.class-a.class-b][role=button]" // ✅ Всегда в алфавитном порядке
"div[.class-b.class-a][role=button]" // ❌ Другой порядок = другой EIQ
```

### 5. Без PII (Personally Identifiable Information)

```typescript
// ❌ НЕПРАВИЛЬНО (содержит email)
"footer > ul > li[text='info@maresereno.com']"

// ✅ ПРАВИЛЬНО (только структурные признаки)
"footer > ul > li#3 > svg[.lucide-mail] > rect"

// Или с хешем
"footer > ul > li[text-hash='7bf591b2']"
```

**Почему важно**:
- Аналитика не должна содержать PII
- GDPR compliance
- Безопасность данных

---

## ❌ ЧЕГО ДЕЛАТЬ НЕЛЬЗЯ

### 1. Использовать EIQ как CSS-селектор

```typescript
// ❌ НЕПРАВИЛЬНО
const elements = document.querySelectorAll(eiq);

// ✅ ПРАВИЛЬНО
const eid = parseEIQ(eiq);
const elements = resolve(eid, document);
```

**Почему**: EIQ содержит meta-информацию (nthChild, constraints), которая не является CSS.

### 2. Делать resolve из строки без AST

```typescript
// ❌ НЕПРАВИЛЬНО
function resolve(eiq: string, dom: Document): Element[] {
  // Парсинг строки напрямую в DOM запрос
  const selector = eiqToCSS(eiq); // BAD!
  return Array.from(dom.querySelectorAll(selector));
}

// ✅ ПРАВИЛЬНО
function resolve(eid: ElementIdentityDescriptor, dom: Document): Element[] {
  // Полноценный resolver с fallback, constraints и т.д.
  return resolverEngine.resolve(eid, dom);
}
```

### 3. Хранить только EIQ и выкидывать EID в rrweb

```typescript
// ❌ НЕПРАВИЛЬНО (потеря данных)
const serialized = {
  type: 2,
  tagName: "rect",
  eiq: "footer > ul > li#3 > svg > rect" // Только строка!
};

// ✅ ПРАВИЛЬНО (EID как source of truth)
const serialized = {
  type: 2,
  tagName: "rect",
  eid: { /* полный EID */ },
  eiq: "footer > ul > li#3 > svg > rect" // Опционально
};
```

**Почему**: EIQ может не содержать всей информации (constraints, fallback, meta).

### 4. Делать несколько эквивалентных EIQ для одного EID

```typescript
// ❌ НЕПРАВИЛЬНО (не детерминировано)
const eiq1 = "footer > ul > li#3";
const eiq2 = "footer>ul>li#3"; // Разные строки!
const eiq3 = "footer > ul > li:nth-child(3)";

// ✅ ПРАВИЛЬНО (канонический формат)
const eiq = "footer > ul > li#3"; // Всегда одинаковый
```

---

## 📐 ФОРМАЛИЗАЦИЯ API

### Stringify API

```typescript
/**
 * Converts EID to canonical string representation (EIQ)
 * 
 * Requirements:
 * - Deterministic (same EID → same EIQ)
 * - Canonical (one EID → one EIQ)
 * - Versioned (includes protocol version)
 * - PII-safe (no personal data)
 * 
 * @param eid - Element Identity Descriptor
 * @returns Element Identity Query (canonical string)
 */
function stringifyEID(eid: ElementIdentityDescriptor): ElementIdentityQuery {
  // Implementation...
}
```

### Parse API

```typescript
/**
 * Parses EIQ string back to EID structure
 * 
 * @param eiq - Element Identity Query (string)
 * @returns Element Identity Descriptor
 * @throws {ParseError} if EIQ is malformed or version unsupported
 */
function parseEIQ(eiq: ElementIdentityQuery): ElementIdentityDescriptor {
  // Implementation...
}
```

### Resolve API

```typescript
/**
 * Resolves EID to actual DOM elements
 * 
 * IMPORTANT: Only accepts EID, never raw EIQ string
 * 
 * @param eid - Element Identity Descriptor (canonical format)
 * @param root - Root element or document to search in
 * @returns Array of matched elements with confidence scores
 */
function resolve(
  eid: ElementIdentityDescriptor, 
  root: Document | Element
): ResolveResult {
  // Implementation...
}
```

### Validation

```typescript
// Type guards
function isValidEID(value: unknown): value is ElementIdentityDescriptor;
function isValidEIQ(value: unknown): value is ElementIdentityQuery;

// Version check
function getEIQVersion(eiq: ElementIdentityQuery): string;
function isCompatibleVersion(version: string): boolean;
```

---

## 📚 РЕКОМЕНДАЦИИ ДЛЯ СПЕЦИФИКАЦИИ

### Добавить в SPECIFICATION.md

```markdown
## 2. Format Distinction

### 2.1 Element Identity Descriptor (EID)

**Type**: Structured JSON / AST
**Purpose**: Canonical format, source of truth
**Usage**: Internal library operations (generation, resolution, comparison)

```typescript
interface ElementIdentityDescriptor {
  version: '1.0';
  anchor: NodeDescriptor;
  path: PathNode[];
  target: NodeDescriptor;
  constraints: Constraint[];
  fallback: FallbackStrategy;
  meta: Metadata;
}
```

### 2.2 Element Identity Query (EIQ)

**Type**: Canonical string representation
**Purpose**: Transport format, human interface
**Usage**: Between systems (analytics, storage, aggregation)

**Requirements**:
- Deterministic
- Canonical
- Versioned
- PII-safe
- Stable-sorted

### 2.3 Architectural Rule

```
EID = Source of Truth
EIQ = Transport Format

Pipeline: EIQ → parse() → EID → resolve() → Element[]
```

**EIQ is NEVER interpreted directly.**
**Always: parse → EID → logic.**
```

---

## 🎯 ИТОГОВАЯ ФОРМУЛА

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  EID — это то, что система понимает               │
│  EIQ — это то, что системы обменивают             │
│                                                    │
│  EID = Understanding                               │
│  EIQ = Communication                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Правила работы

1. **Generation**: Element → EID
2. **Transport**: EID → stringify → EIQ
3. **Storage**: EIQ (compact) или EID (full)
4. **Aggregation**: Group by EIQ
5. **Resolution**: EIQ → parse → EID → resolve → Element[]

### Запреты

- ❌ EIQ → CSS (без parse)
- ❌ EIQ → resolve (без EID)
- ❌ Множественные EIQ для одного EID
- ❌ PII в EIQ
- ❌ Недетерминированный stringify

---

## 📋 ЧЕКЛИСТ ДЛЯ РЕАЛИЗАЦИИ

### Phase 1: Core API

- [ ] Определить TypeScript типы EID и EIQ
- [ ] Реализовать `stringifyEID(eid): EIQ`
- [ ] Реализовать `parseEIQ(eiq): EID`
- [ ] Добавить версионирование в EIQ
- [ ] Написать тесты на детерминированность

### Phase 2: rrweb Integration

- [ ] Добавить EID в `serializeNode()`
- [ ] Сохранять EID в snapshot
- [ ] Опционально сохранять EIQ для инспекции

### Phase 3: Analytics Integration

- [ ] Реализовать `trackInteraction()` с EIQ
- [ ] Настроить GA custom dimensions для EIQ
- [ ] Фильтрация PII из EIQ

### Phase 4: Player Integration

- [ ] Реализовать `parseEIQ()` в player
- [ ] Resolve с EID из analytics
- [ ] Рендеринг тепловой карты

### Phase 5: Documentation

- [ ] Обновить SPECIFICATION.md
- [ ] Добавить примеры в README
- [ ] Создать migration guide

---

## 🔄 ПРИМЕР ПОЛНОГО FLOW

```typescript
// ===== 1. rrweb Recording =====
const eid = generateEID(element);
snapshot.nodes[123].eid = eid; // Full EID
snapshot.nodes[123].eiq = stringifyEID(eid); // Optional

// ===== 2. Analytics =====
element.addEventListener('click', () => {
  const eid = getEIDForElement(element);
  const eiq = stringifyEID(eid);
  
  gtag('event', 'click', {
    element_identity: eiq // "footer > ul > li#3 > svg > rect"
  });
});

// ===== 3. Backend Aggregation =====
const analytics = await fetchAnalytics();
const grouped = groupBy(analytics, event => event.element_identity);

// grouped["footer > ul > li#3 > svg > rect"] = { count: 245, ... }

// ===== 4. Player Replay =====
for (const [eiq, stats] of Object.entries(grouped)) {
  const eid = parseEIQ(eiq); // EIQ → EID
  const elements = resolve(eid, rrdom); // EID → Element[]
  
  highlightElement(elements[0], stats);
}
```

---

## ✅ ЗАКЛЮЧЕНИЕ

Ваше решение использовать **EIQ как transport format** является **архитектурно корректным** при соблюдении ключевого принципа:

```
EIQ используется как транспорт и интерфейс,
EID остаётся источником истины внутри системы.
```

**Преимущества**:
- ✅ Компактность для GA
- ✅ Человекочитаемость
- ✅ Простота передачи
- ✅ Агрегация по ключу
- ✅ Отделение concerns

**Критически важно**:
- 🔒 EIQ всегда парсится в EID перед resolve
- 🔒 Детерминированность и каноничность EIQ
- 🔒 Версионирование протокола
- 🔒 Отсутствие PII

**Формула успеха**:
```
EID = Understanding (AST, logic)
EIQ = Communication (string, transport)

Pipeline: EIQ → parse → EID → resolve → Element[]
```
