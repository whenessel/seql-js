# DSL Identity Specification v1.0

## Спецификация языка идентификации DOM-элементов для rrweb, аналитики и воспроизведения

**Версия**: 1.0  
**Статус**: Утверждено  
**Дата**: 2025-01-15  
**Авторы**: Artem (Backend/Frontend Developer)

---

## Оглавление

1. [Введение](#введение)
2. [Контекст и мотивация](#контекст-и-мотивация)
3. [Область применения](#область-применения)
4. [Ключевые требования](#ключевые-требования)
5. [Модель идентичности](#модель-идентичности)
6. [Спецификация DSL](#спецификация-dsl)
7. [Anchor Strategy](#anchor-strategy)
8. [Path Construction](#path-construction)
9. [SVG Stability](#svg-stability)
10. [Semantic Filtering](#semantic-filtering)
11. [Text Normalization](#text-normalization)
12. [Constraints](#constraints)
13. [Resolver Algorithm](#resolver-algorithm)
14. [Serialization Format](#serialization-format)
15. [Integration with rrweb](#integration-with-rrweb)
16. [Metrics & Success Criteria](#metrics--success-criteria)
17. [Limitations & Prohibitions](#limitations--prohibitions)

---

## Введение

DSL Identity — это декларативный язык описания идентичности DOM-элементов, который:
- Описывает **что это за элемент**, а не **как до него дойти**
- Сохраняет семантику элемента во времени
- Переживает изменения DOM-структуры и layout
- Пригоден для аналитики, агрегации и воспроизведения

### Ключевой принцип

```
CSS и XPath — это способы искать.
DSL — это способ помнить, что именно было найдено.
```

---

## Контекст и мотивация

### Проблема

В экосистеме веб-аналитики и session replay (в частности rrweb) отсутствует устойчивый, детерминированный механизм идентификации DOM-элементов.

**Существующие подходы (CSS, XPath, nth-*, id, class):**
- ❌ Нестабильны при изменениях структуры
- ❌ Часто неуникальны
- ❌ Плохо масштабируются между сессиями
- ❌ Не выражают семантику элемента
- ❌ Не решают задачу корреляции данных

### Цель

Разработать DSL, который:
- Детерминированно генерируется во время записи
- Сериализуется вместе с DOM-снапшотом
- Используется для аналитики и корреляции
- Резолвится в DOM во время воспроизведения

---

## Область применения

DSL используется в трёх независимых, но согласованных контекстах:

### 1. Recording (rrweb recorder) — PRIMARY
DSL генерируется при пользовательских взаимодействиях:
- click, input, focus, hover (опционально)

**Требования:**
- Минимальный runtime overhead
- Строгая детерминированность
- Независимость от порядка событий

### 2. Analytics (runtime / production) — PRIMARY
DSL используется для:
- Агрегации событий по "одному и тому же элементу"
- Сравнения элементов между сессиями
- Корреляции данных между e2e-тестами и продакшн-трафиком

### 3. Replay (rrweb player) — SECONDARY
DSL используется для:
- Резолва DSL → DOM в восстановленном DOM
- Подсветки и навигации
- Сопоставления с аналитическими метриками (heatmap)

---

## Ключевые требования

### Функциональные требования

DSL обязан:
- ✅ Однозначно описывать логический элемент
- ✅ Быть детерминированным и идемпотентным
- ✅ Поддерживать резолв в нативном DOM и rrdom
- ✅ Поддерживать деградацию и fallback
- ✅ Быть сериализуемым (JSON)
- ✅ Быть версионируемым

### Нефункциональные требования

DSL обязан:
- ✅ Быть независимым от UI-фреймворков
- ✅ Не зависеть от layout-структуры
- ✅ Не требовать изменений HTML
- ✅ Не нарушать privacy (PII)
- ✅ Иметь предсказуемую вычислительную сложность O(depth)
- ✅ Быть исполнимым в browser sandbox

---

## Модель идентичности

### Принцип
DSL описывает **"что это за элемент"**, а не **"как до него дойти"**.

### Инварианты идентичности

| Изменение | Требование |
|-----------|-----------|
| Повторная генерация | DSL идентичен |
| Изменение layout | DSL не меняется |
| Перестановка siblings | DSL не меняется |
| Добавление wrapper | DSL не меняется |
| Replay DOM | DSL резолвится |

### Стабильность DSL

DSL селектор **должен быть стабильным как идентификатор**:
- ≥ 95% стабильность между сессиями для одного элемента
- ≥ 99% успешность резолва в replay

---

## Спецификация DSL

### Структура DSL (обязательная)

DSL состоит из:
1. **Anchor** — логическая область (корень контекста)
2. **Path** — последовательность семантических узлов (anchor → target_parent)
3. **Target** — целевой элемент (описывается отдельно)
4. **Constraints** — условия для disambiguation
5. **Fallback rules** — поведение при неоднозначности
6. **Meta** — версия, confidence, флаги деградации

### Узел DSL

Каждый узел обязан:
- Явно указывать `tag`
- Содержать 0–N семантических признаков
- Иметь `score` (приоритет/уверенность)
- Быть валидируемым независимо

---

## Anchor Strategy

### Роль Anchor

Anchor — это **корень смысловой области**, а не ближайший родитель.

Anchor:
- Задаёт контекст интерпретации DSL
- Ограничивает пространство резолва
- Повышает устойчивость к структурным изменениям

### Алгоритм поиска Anchor

#### Направление поиска
Снизу вверх от target-элемента до выполнения условия остановки.

#### Условия остановки (приоритет)

1. **Семантический корневой элемент**:
   ```html
   <main>, <form>, <nav>, <footer>, <header>, <section>, <article>
   ```

2. **`<body>`**

3. **Лимит глубины**: 10 уровней

### Приоритеты Anchor-кандидатов

#### Tier A — Нативная семантика (максимальный приоритет)
```html
<form>, <main>, <nav>, <section>, <article>, <footer>, <header>
```

**Бонусы**:
- `id` (стабильный, не dynamic)
- `aria-label`
- `aria-labelledby`
- `role`

#### Tier B — Role-based семантика
```html
<div role="form">
<div role="navigation">
```

**Условия**:
- Role валиден (ARIA spec)
- Role контейнерный (не интерактивный)

**Допустимые роли**:
```
form, navigation, main, region, contentinfo, complementary
```

#### Tier C — Test / analytics markers (ограниченно)
```html
<div data-testid="checkout-form">
<div data-qa="footer-contacts">
```

**Правила**:
- Только если Tier A/B отсутствуют
- Score ниже семантических тегов
- Запрещены как единственный критерий

### Явно запрещённые Anchor-кандидаты

Anchor **НЕ может быть** выбран на основании:
- ❌ Utility-классов (`flex`, `grid`, `mt-4`)
- ❌ Framework-идентификаторов (`data-reactroot`)
- ❌ Purely visual wrappers
- ❌ `<div>` без role/semantic attributes

### Fallback при отсутствии Anchor

#### Fallback 1 — Ближайший уникальный контейнер
Выбирается ближайший вверх элемент с уникальным признаком:
- `aria-label`
- `role`
- Устойчивый `data-*`

Становится **degraded-anchor**.

#### Fallback 2 — `<body>`
```json
{
  "anchor": {
    "tag": "body",
    "score": 0.3,
    "degraded": true
  }
}
```

### Scoring-модель Anchor

```javascript
anchorScore = 
  semanticTagScore +    // +0.5
  ariaScore +           // +0.2
  roleScore +           // +0.15
  uniquenessBonus -     // +0.1
  depthPenalty          // -0.05 за уровень > 5
```

Anchor с максимальным score выбирается.

---

## Path Construction

### Алгоритм обхода

#### Входные данные
- `anchor` — выбранный семантический anchor
- `target` — целевой DOM-элемент

#### Направление обхода
**Снизу вверх** (target → anchor) по цепочке `parentElement`.

#### Условия остановки
1. Достижение `anchor`
2. Достижение `<body>` (ошибка конфигурации)
3. Превышение `MAX_PATH_DEPTH` (норматив: **10**)

#### Результат
Путь **инвертируется** (anchor → target_parent) и используется как `path` в DSL.

### Критерии включения узла в Path

DOM-узел включается в path, если выполняется **хотя бы одно**:

1. **Semantic tag**:
   - HTML5 semantic elements
   - Form elements
   - Interactive elements
   - Table elements
   - SVG elements

2. **Semantic attributes**:
   - `aria-*`, `name`, `type`, `role`

3. **Semantic class** (не utility)

4. **Интерактивный элемент**:
   - `button`, `a`, `input`, etc.

5. **Необходим для disambiguation**:
   - Несколько `<li>` внутри `<ul>`

### Пропуск noise-элементов

DOM-узел **пропускается**, если:

1. `tag === "div"` **И одновременно**:
   - Нет semantic attributes
   - Нет semantic classes
   - Нет `role`

2. Содержит только utility classes

3. Не влияет на уникальность target

4. Используется исключительно для layout:
   - Grid/flex wrapper
   - Animation wrapper
   - Spacing wrapper

**Важно**: пропуск не должен нарушать достижимость anchor.

### Disambiguation при пропуске узлов

Если после пропуска noise-элементов DSL неуникален:

1. Добавляем пропущенные узлы **по очереди**
2. Порядок: **от target к anchor** (ближайшие к target первыми)
3. После каждого добавления — проверка уникальности
4. Останавливаемся при достижении уникальности

Если всё ещё неуникально → переход к **Constraints**.

### Инварианты Path

Path **никогда не содержит**:
- ❌ `nth-*`
- ❌ Индекс sibling
- ❌ Layout-зависимые признаки

Path описывает **смысловую цепочку**, а не DOM-структуру.

---

## SVG Stability

### Проблема

SVG-параметры нестабильны:
- `d` (path data) может генерироваться динамически
- `transform`, `x/y`, `cx/cy` часто анимируются
- `viewBox` может меняться без изменения визуального смысла

### Решение: SvgFingerprint

```typescript
interface SvgFingerprint {
  shape: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'polygon';
  dHash?: string;        // только для path
  geomHash?: string;     // для circle/rect/etc
  hasAnimation: boolean;
  role?: string;         // aria-role
  titleText?: string;    // <title> внутри SVG
}
```

### Нормативы

#### ✅ Использовать:
- `shape` (тип элемента)
- `dHash` / `geomHash` (fingerprint геометрии)
- `<title>` текст
- `role` атрибут

#### ❌ НЕ использовать:
- Сырые `transform`, `x/y`, `cx/cy` как истину
- BBox нормализацию (v1)
- Floating-point координаты напрямую

### Алгоритм вычисления dHash

**Для `<path>` элементов:**

1. Взять только **первые N команд** (N = 3…5)
2. Нормализовать:
   - Удалить лишние пробелы
   - Округлить числа (до 2 знаков)
   - Привести команды к абсолютным (M/L/C)
3. Хешировать (SHA-1 / Murmur / xxhash)

**Пример**:
```javascript
// Исходный path
d = "M10.5,20.3 L30.7,40.2 C50,60 70,80 90,100"

// Нормализация (первые 3 команды)
normalized = "M10.50,20.30 L30.70,40.20 C50.00,60.00,70.00,80.00,90.00,100.00"

// Hash
dHash = sha1(normalized).substring(0, 16)
// -> "a3f5c8d9e1b2..."
```

### Обработка анимаций

Если обнаружен `<animate>`, `<animateTransform>`, или CSS animations:
```json
{
  "hasAnimation": true
}
```

Resolver при `hasAnimation: true`:
- Игнорирует текущие значения transform
- Использует базовые (unanimated) значения
- Применяет более мягкие thresholds для matching

---

## Semantic Filtering

### Проблема

Utility classes (`flex`, `mt-4`, `grid`, `col-4`) не несут семантики и нестабильны.

### Semantic Class Definition

Класс считается **semantic**, если выполняется хотя бы одно:
- Отражает роль/назначение элемента (`submit`, `nav-item`, `contact-phone`)
- Стабилен между билдами
- Используется в бизнес-логике/тестах
- **Не** кодирует layout/spacing/color

### Utility Class Definition

Класс считается **utility**, если:
- Кодирует визуальное свойство (`flex`, `grid`, `mt-4`, `text-muted`)
- Содержит числовые суффиксы (`p-2`, `col-4`, `gap-8`)
- Имеет префиксы utility-фреймворков (`tw-`, `md:`, `lg:`, `hover:`)

### Алгоритм фильтрации (v1)

#### Hard rule — Blacklist (regex)
```javascript
const UTILITY_PATTERN = /^(p|m|px|py|pt|pb|pl|pr|mt|mb|ml|mr|gap|grid|flex|col|row|w|h|text|bg|border|rounded|shadow|opacity|z|top|bottom|left|right)[-:]/;

function isUtilityClass(className) {
  return UTILITY_PATTERN.test(className);
}
```

#### Soft rules — Эвристики (scoring)
```javascript
function getClassScore(className) {
  let score = 1.0;
  
  if (className.length < 3) score *= 0.3;           // слишком короткий
  if (/\d/.test(className)) score *= 0.5;          // содержит цифры
  if (/(sm|md|lg|xl)[:_]/.test(className)) score *= 0.4; // breakpoints
  if (isUtilityClass(className)) score = 0;        // utility → 0
  
  return score;
}
```

### Применение в DSL

```json
{
  "semantics": {
    "classes": ["submit-btn", "primary"],  // только semantic
    "utilityClasses": ["mt-4", "flex"]     // помечены отдельно (опционально)
  }
}
```

Resolver использует только `classes`, игнорирует `utilityClasses`.

---

## Text Normalization

### Проблема

Текст в DOM может содержать:
- Лишние пробелы (`"  Submit  "`)
- Переносы строк (`"Submit\n"`)
- Unicode вариации

### Нормативы

Текст **всегда нормализуется**, но хранится в **двух формах**:

```json
{
  "text": {
    "raw": "  +39 123 4567 890 \n",
    "normalized": "+39 123 4567 890"
  }
}
```

### Правила нормализации

#### Обязательно:
1. `trim()` — удаление начальных/конечных пробелов
2. `\n`, `\t` → пробел
3. Схлопывание пробелов (`/\s+/g` → `" "`)

#### Опционально (configurable):
- `toLowerCase()` — **по умолчанию ❌**
- Unicode normalization (NFKC) — **по умолчанию ❌**

### Пример

```javascript
function normalizeText(text) {
  return text
    .trim()
    .replace(/[\n\t]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Пример
normalizeText("  Submit\n  Order  ")
// -> "Submit Order"
```

### Использование в Resolver

Resolver сравнивает **normalized** текст:
```javascript
const match = node.textContent.normalize() === dsl.text.normalized;
```

`raw` хранится для отладки и инспекции.

---

## Constraints

### Назначение

Constraints применяются **только если path не даёт уникального соответствия**.

Constraints:
- ❌ **НЕ** участвуют в генерации DSL
- ❌ **НЕ** изменяют DSL
- ✅ Применяются только resolver-ом

### Структура Constraint

```typescript
interface Constraint {
  type: string;
  params: Record<string, any>;
  priority: number;  // 0-100, выше = важнее
}
```

### Типы Constraints (v1)

#### 1. uniqueness

```json
{
  "type": "uniqueness",
  "params": {
    "mode": "strict" | "best-score" | "allow-multiple"
  },
  "priority": 100
}
```

**Поведение**:
- `strict` → ошибка при >1 совпадении
- `best-score` → выбрать элемент с max score
- `allow-multiple` → вернуть все кандидаты

#### 2. visibility

```json
{
  "type": "visibility",
  "params": {
    "required": true
  },
  "priority": 80
}
```

Ограничивает выбор **видимыми** элементами:
```javascript
function isVisible(element) {
  const style = getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' &&
         style.opacity !== '0';
}
```

#### 3. text-proximity

```json
{
  "type": "text-proximity",
  "params": {
    "reference": "Submit",
    "maxDistance": 2
  },
  "priority": 60
}
```

Использует **Levenshtein distance** для текстового matching.

#### 4. position (degraded fallback)

```json
{
  "type": "position",
  "params": {
    "strategy": "top-most" | "left-most" | "first-in-dom"
  },
  "priority": 20
}
```

**Важно**: всегда помечает результат как `degraded: true`.

### Приоритеты применения

1. Constraints сортируются по `priority` (desc)
2. Применяются **по очереди**
3. После каждого constraint — проверка уникальности:
   - 1 элемент → завершить
   - 0 элементов → ошибка/fallback
   - >1 элемент → продолжить

### Запреты

Constraints **НЕ должны**:
- ❌ Использовать `nth-child`
- ❌ Менять DSL
- ❌ Зависеть от случайности
- ❌ Маскировать ambiguity без сигнала

---

## Resolver Algorithm

### Входные данные
- `dsl` — DSL объект
- `dom` — корень DOM (native или rrdom)

### Выходные данные
```typescript
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
```

### Последовательность выполнения

#### Phase 1: CSS Narrowing

1. Построение CSS-селектора из DSL:
   ```javascript
   const selector = buildCssSelector(dsl);
   // Например: "form[aria-label='Contact'] > ul.contact-list > li"
   ```

2. Выполнение `querySelectorAll()`:
   ```javascript
   const candidates = dom.querySelectorAll(selector);
   ```

#### Phase 2: Semantics Filtering

Применение JS-фильтрации по `semantics`:

```javascript
const filtered = candidates.filter(element => {
  return matchText(element, dsl.text) &&
         matchAttributes(element, dsl.attributes) &&
         matchSvgFingerprint(element, dsl.svg);
});
```

#### Phase 3: Uniqueness Check

```javascript
if (filtered.length === 1) {
  return { status: 'success', elements: filtered };
}

if (filtered.length === 0) {
  return { status: 'error', elements: [] };
}

// filtered.length > 1 → proceed to Phase 4
```

#### Phase 4: Constraints Application

```javascript
let candidates = filtered;

for (const constraint of sortByPriority(dsl.constraints)) {
  candidates = applyConstraint(candidates, constraint);
  
  if (candidates.length === 1) {
    return { status: 'success', elements: candidates };
  }
  
  if (candidates.length === 0) {
    return handleFallback(dsl, dom);
  }
}
```

#### Phase 5: Result

```javascript
if (candidates.length === 1) {
  return {
    status: 'success',
    elements: candidates,
    confidence: calculateConfidence(dsl, candidates[0])
  };
}

if (candidates.length > 1) {
  return {
    status: 'ambiguous',
    elements: candidates,
    warnings: ['Non-unique DSL resolution'],
    confidence: calculateConfidence(dsl, candidates[0]) * 0.7
  };
}

// candidates.length === 0
return handleFallback(dsl, dom);
```

### Fallback Strategy

```javascript
function handleFallback(dsl, dom) {
  switch (dsl.fallback.onMissing) {
    case 'anchor-only':
      const anchor = resolveAnchor(dsl.anchor, dom);
      return {
        status: 'degraded-fallback',
        elements: [anchor],
        warnings: ['Target not found, returning anchor'],
        meta: { degraded: true, degradationReason: 'target-not-found' }
      };
    
    case 'strict':
      return {
        status: 'error',
        elements: [],
        warnings: ['Element not found']
      };
    
    default:
      return { status: 'error', elements: [] };
  }
}
```

---

## Serialization Format

### Полная структура DSL JSON

```json
{
  "version": "1.0",

  "anchor": {
    "tag": "footer",
    "semantics": {
      "role": "contentinfo",
      "attributes": {
        "aria-label": "Contact Information"
      }
    },
    "score": 0.92,
    "degraded": false
  },

  "path": [
    {
      "tag": "div",
      "semantics": {
        "classes": ["contact-section"]
      },
      "score": 0.75
    },
    {
      "tag": "ul",
      "semantics": {
        "classes": ["contact-list"],
        "attributes": {
          "role": "list"
        }
      },
      "score": 0.8
    },
    {
      "tag": "li",
      "semantics": {
        "text": {
          "raw": "  +39 123 4567 890 \n",
          "normalized": "+39 123 4567 890"
        }
      },
      "score": 0.97
    }
  ],

  "target": {
    "tag": "a",
    "semantics": {
      "attributes": {
        "href": "tel:+39123456890",
        "aria-label": "Call phone number"
      },
      "text": {
        "normalized": "+39 123 4567 890"
      }
    },
    "score": 0.95
  },

  "constraints": [
    {
      "type": "uniqueness",
      "params": {
        "mode": "best-score"
      },
      "priority": 100
    },
    {
      "type": "visibility",
      "params": {
        "required": true
      },
      "priority": 80
    }
  ],

  "fallback": {
    "onMultiple": "allow-multiple",
    "onMissing": "anchor-only",
    "maxDepth": 3
  },

  "meta": {
    "confidence": 0.93,
    "generatedAt": "2025-01-15T10:30:00Z",
    "generator": "rrweb-dsl-gen@1.0.0",
    "source": "rrweb-recorder",
    "degraded": false
  }
}
```

### Confidence Calculation

```javascript
function calculateConfidence(dsl) {
  const anchorScore = dsl.anchor.score;
  const avgPathScore = average(dsl.path.map(n => n.score));
  const targetScore = dsl.target.score;
  
  let uniquenessBonus = 0;
  // Определяется после резолва
  
  return (
    anchorScore * 0.4 +
    avgPathScore * 0.3 +
    targetScore * 0.2 +
    uniquenessBonus * 0.1
  );
}
```

### Версионирование

DSL поддерживает **forward compatibility**:
- Resolver v2.0 понимает DSL v1.0
- Неизвестные поля игнорируются
- `version` обязательное поле

---

## Integration with rrweb

### Место в rrweb pipeline

DSL генерируется на этапе **serializeNode** и добавляется как метаданные:

```javascript
function serializeNode(node, options) {
  const serialized = {
    type: node.nodeType,
    tagName: node.tagName,
    // ... стандартные поля rrweb
  };
  
  if (options.enableDslIdentity && isInteractive(node)) {
    serialized.dslIdentity = generateDsl(node, options);
  }
  
  return serialized;
}
```

### Использование в recorder

При событии взаимодействия:
```javascript
recorder.on('click', (event) => {
  const target = event.target;
  const dsl = generateDsl(target, {
    maxPathDepth: 10,
    enableSvgFingerprint: true
  });
  
  emitEvent({
    type: 'IncrementalSource.MouseInteraction',
    data: {
      type: 'click',
      id: target.__sn.id,  // rrweb node id
      dslIdentity: dsl     // добавлено
    }
  });
});
```

### Использование в player

При воспроизведении:
```javascript
player.on('event', (event) => {
  if (event.data.dslIdentity) {
    const resolved = resolveDsl(event.data.dslIdentity, player.iframe.contentDocument);
    
    if (resolved.status === 'success') {
      highlightElement(resolved.elements[0]);
    }
  }
});
```

### Аналитическая агрегация

DSL используется для корреляции:
```javascript
const analytics = {
  elementId: hash(dsl),  // стабильный ID элемента
  clicks: 0,
  sessions: []
};

// Группировка событий
events
  .filter(e => hash(e.dslIdentity) === analytics.elementId)
  .forEach(e => analytics.clicks++);
```

---

## Metrics & Success Criteria

### Метрики успешности

Решение считается успешным, если:

| Метрика | Целевое значение | Критичность |
|---------|------------------|-------------|
| Стабильность DSL между сессиями | ≥ 95% | Критичная |
| Успешность резолва в replay | ≥ 99% | Критичная |
| Устойчивость к layout changes | 100% | Критичная |
| Производительность генерации | ≤ O(depth) | Высокая |
| Производительность резолва | ≤ O(candidates) | Высокая |
| Размер DSL | ≤ 2KB JSON | Средняя |

### Confidence диапазоны

| Диапазон | Оценка | Действие |
|----------|--------|----------|
| 0.0 - 0.3 | Критически низкий | Требует пересмотра markup |
| 0.3 - 0.6 | Низкий | Работает, но хрупкий |
| 0.6 - 0.8 | Средний | Допустимо |
| 0.8 - 1.0 | Высокий | Стабильный DSL |

### Мониторинг

Рекомендуется отслеживать:
- Процент `degraded: true` DSL
- Распределение `confidence` scores
- Частота `ambiguous` резолвов
- Процент fallback к `anchor-only`

---

## Limitations & Prohibitions

### DSL НЕ должен

❌ **Требовать изменения DOM**
- Не требует специальных атрибутов в HTML
- Работает с любым существующим markup

❌ **Хранить CSS/XPath как истину**
- CSS — только транспорт
- XPath — только fallback фильтр

❌ **Зависеть от nth-child**
- Порядок siblings нестабилен
- Использовать только semantic признаки

❌ **Использовать dynamic id**
- ID вида `element-12345` игнорируются
- Только стабильные, человеко-читаемые ID

❌ **Использовать inline styles**
- `style` атрибут игнорируется
- Только semantic attributes

❌ **Нарушать privacy**
- PII не включается в DSL
- Email, phone, личные данные маскируются

### Запрещённые техники

❌ Абсолютные координаты (x, y)
❌ Layout-зависимые признаки (width, height)
❌ Framework-специфичные ID (`data-reactid`)
❌ Random/generated классы (`css-1a2b3c`)
❌ Z-index, opacity как критерии
❌ Viewport-зависимые признаки

---

## Приложения

### A. Semantic Tags Reference

Полный список semantic tags по категориям — см. **DECISIONS.md § 3**.

### B. Utility Class Patterns

Регулярные выражения для blacklist — см. **DECISIONS.md § 3**.

### C. SVG Hash Examples

Примеры вычисления dHash для разных SVG shapes.

### D. Test Cases

Набор edge-кейсов для валидации реализации.

---

## Changelog

### v1.0 (2025-01-15)
- Начальная версия спецификации
- Определены все нормативы
- Утверждены архитектурные решения

---

**Статус документа**: УТВЕРЖДЕНО  
**Следующий review**: После реализации proof-of-concept  
**Контакт**: Artem (Backend/Frontend Developer)
