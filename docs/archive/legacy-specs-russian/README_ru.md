# DSL Identity — DOM Element Identification System

> Устойчивая идентификация DOM-элементов для rrweb, аналитики и воспроизведения

**Версия**: 1.0  
**Статус**: Specification Phase  
**Язык**: TypeScript

---

## 🎯 Что это?

DSL Identity — это декларативный язык описания идентичности DOM-элементов, который:

- ✅ **Устойчив** к изменениям структуры DOM и layout
- ✅ **Детерминирован** (одинаковый элемент → одинаковый DSL)
- ✅ **Семантичен** (описывает "что", а не "как искать")
- ✅ **Сериализуем** (JSON)
- ✅ **Резолвим** обратно в DOM-элемент

### Ключевая формула

```
CSS и XPath — это способы искать.
DSL — это способ помнить, что именно было найдено.
```

---

## 🚀 Quick Start

### Генерация DSL

```typescript
import { generateDsl } from 'dsl-identity';

const button = document.querySelector('button.submit');
const dsl = generateDsl(button);

console.log(dsl);
// {
//   "version": "1.0",
//   "anchor": { "tag": "form", "semantics": {...}, "score": 0.92 },
//   "path": [...],
//   "target": { "tag": "button", "semantics": {...} },
//   "meta": { "confidence": 0.93 }
// }
```

### Резолв DSL → DOM

```typescript
import { resolveDsl } from 'dsl-identity';

const result = resolveDsl(dsl, document);

if (result.status === 'success') {
  const element = result.elements[0];
  console.log('Found:', element);
}
```

---

## 📚 Документация

### Основные документы

| Документ                                                   | Описание                              | Для кого                  |
| ---------------------------------------------------------- | ------------------------------------- | ------------------------- |
| [**REQUIREMENTS.md**](./REQUIREMENTS.md)                   | Постановка задачи, контекст, цели     | Product, Stakeholders     |
| [**SPECIFICATION.md**](./SPECIFICATION.md)                 | Полная спецификация DSL v1.0          | Разработчики, Архитекторы |
| [**DECISIONS.md**](./DECISIONS.md)                         | Архитектурные решения с обоснованиями | Архитекторы, Tech Leads   |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md)                   | Техническая архитектура системы       | Разработчики              |
| [**AI_AGENT_INSTRUCTIONS.md**](./AI_AGENT_INSTRUCTIONS.md) | Инструкции для ИИ-ассистентов         | AI Agents, LLMs           |

### Рекомендуемый порядок чтения

**Для Product Managers**:

1. README.md (этот файл)
2. REQUIREMENTS.md

**Для Разработчиков**:

1. README.md
2. REQUIREMENTS.md
3. SPECIFICATION.md
4. ARCHITECTURE.md

**Для Архитекторов**:

1. REQUIREMENTS.md
2. SPECIFICATION.md
3. DECISIONS.md
4. ARCHITECTURE.md

**Для AI Agents**:

1. AI_AGENT_INSTRUCTIONS.md
2. SPECIFICATION.md
3. DECISIONS.md

---

## 🎨 Концептуальный пример

### Проблема: нестабильные селекторы

```html
<!-- Было -->
<form>
  <div class="flex">
    <button class="mt-4">Submit</button>
  </div>
</form>

<!-- CSS селектор -->
form > div > button
```

```html
<!-- Стало (после рефакторинга) -->
<form>
  <div class="grid">
    <div class="wrapper">
      <button class="mb-2">Submit</button>
    </div>
  </div>
</form>

<!-- CSS селектор сломался ❌ -->
form > div > button // не работает
```

### Решение: DSL Identity

```json
{
  "anchor": {
    "tag": "form",
    "semantics": { "role": "form" }
  },
  "path": [],
  "target": {
    "tag": "button",
    "semantics": {
      "text": { "normalized": "Submit" }
    }
  }
}
```

**DSL описывает**: "Кнопка с текстом 'Submit' в форме"

✅ Работает до и после рефакторинга  
✅ Не зависит от layout (flex → grid)  
✅ Не зависит от wrapper'ов

---

## 🏗️ Архитектура

### Компоненты

```
┌──────────────┐
│  DOM Element │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  DSL Generator   │  ← Генерирует DSL из элемента
│  • Anchor Finder │
│  • Path Builder  │
│  • Semantics     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  DSL Identity    │  ← JSON representation
│  (JSON)          │
└──────┬───────────┘
       │
       ├──→ Analytics Storage
       │
       └──→ rrweb Recorder
              │
              ▼
       ┌──────────────────┐
       │  rrweb Player    │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  DSL Resolver    │  ← Резолвит DSL → DOM
       │  • CSS Narrowing │
       │  • JS Filtering  │
       │  • Constraints   │
       └──────┬───────────┘
              │
              ▼
       ┌──────────────────┐
       │  DOM Element     │  ← Найденный элемент
       └──────────────────┘
```

---

## 🔑 Ключевые особенности

### 1. Anchor Strategy

DSL использует **семантический anchor** — корень смысловой области:

```html
<main>
  <form id="contact">
    ← Anchor
    <input name="email" />
    <button>Submit</button> ← Target
  </form>
</main>
```

DSL: `anchor: <form> → target: <button>`

**Приоритеты anchor**:

1. **Tier A**: `<form>`, `<main>`, `<nav>`, `<section>` + semantic attributes
2. **Tier B**: `<div role="form">`, `<div role="navigation">`
3. **Tier C**: `<div data-testid="checkout">`

### 2. Semantic Path

Path содержит только **смысловые узлы**, пропускает layout wrappers:

```html
<form>
  <div class="flex">
    ← пропускается (layout)
    <div class="wrapper">
      ← пропускается (layout)
      <ul class="items">
        ← включается (semantic)
        <li>
          ← включается (semantic)
          <button>Click</button>
        </li>
      </ul>
    </div>
  </div>
</form>
```

Path: `form → ul → li → button`

### 3. SVG Fingerprinting

Для SVG-элементов используется **fingerprint** вместо координат:

```typescript
{
  "svg": {
    "shape": "path",
    "dHash": "a3f5c8d9...",  // hash первых команд path
    "hasAnimation": false,
    "titleText": "menu-icon"
  }
}
```

### 4. Text Normalization

Текст хранится в двух формах:

```json
{
  "text": {
    "raw": "  Submit Order  \n",
    "normalized": "Submit Order"
  }
}
```

Resolver использует `normalized` для matching.

---

## 📊 Метрики успешности

| Метрика                         | Target | Status  |
| ------------------------------- | ------ | ------- |
| Стабильность DSL между сессиями | ≥ 95%  | 🎯 Spec |
| Успешность резолва в replay     | ≥ 99%  | 🎯 Spec |
| Устойчивость к layout changes   | 100%   | 🎯 Spec |
| Время генерации DSL             | ≤ 5ms  | 🎯 Spec |
| Время резолва DSL               | ≤ 50ms | 🎯 Spec |

---

## 🔧 Use Cases

### 1. Session Replay (rrweb)

```typescript
// Recording
rrweb.record({
  emit(event) {
    if (event.data?.dslIdentity) {
      // DSL attached to click events
      analytics.track(event.data.dslIdentity);
    }
  },
  plugins: [new RrwebDslPlugin()],
});

// Replay
const replayer = new rrweb.Replayer(events, {
  plugins: [
    new RrwebDslResolverPlugin({
      onResolve(result) {
        highlightElement(result.elements[0]);
      },
    }),
  ],
});
```

### 2. Analytics Aggregation

```typescript
// Группировка кликов по элементу
const clicks = events.reduce((acc, event) => {
  const elementId = hash(event.dslIdentity);
  acc[elementId] = (acc[elementId] || 0) + 1;
  return acc;
}, {});

// Heatmap
generateHeatmap(clicks);
```

### 3. E2E Testing Correlation

```typescript
// Сопоставление элементов между test и production
const testDsl = generateDsl(testElement);
const prodDsl = generateDsl(prodElement);

if (dslEqual(testDsl, prodDsl)) {
  console.log('Same element in test and production');
}
```

---

## 🚫 Ограничения

DSL **НЕ использует**:

- ❌ `nth-child` (нестабильно)
- ❌ Dynamic IDs (`element-12345`)
- ❌ Utility classes (`mt-4`, `flex`)
- ❌ Абсолютные координаты (x, y)
- ❌ Layout-зависимые признаки

DSL **использует**:

- ✅ Semantic tags (`<form>`, `<button>`)
- ✅ Semantic attributes (`name`, `aria-label`)
- ✅ Semantic classes (`submit-btn`, `nav-item`)
- ✅ Normalized text content
- ✅ SVG fingerprints

---

## 🛠️ Development Status

### Current Phase: Specification ✅

- [x] Requirements gathering
- [x] Architecture design
- [x] Specification complete
- [x] Decisions documented

### Next Phase: Implementation 🚧

- [ ] Core generator
- [ ] Core resolver
- [ ] Unit tests
- [ ] Integration with rrweb

### Future Phases

- [ ] Performance optimization
- [ ] Analytics pipeline
- [ ] Browser extension

---

## 🤝 Contributing

### Для разработчиков

1. Прочитайте [SPECIFICATION.md](./SPECIFICATION.md)
2. Прочитайте [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Следуйте coding standards в spec

### Для AI Agents

1. **Обязательно** прочитайте [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md)
2. Следуйте указанным правилам работы
3. Ссылайтесь на спецификацию при ответах

---

## 📄 License

TBD

---

## 👤 Автор

**Artem**  
Backend & Frontend Developer  
Expertise: TypeScript, rrweb, browser automation, WebDriver

---

## 📞 Контакты

- GitHub Issues: [создать issue](https://github.com/your-repo/issues)
- Email: TBD

---

## 🔗 Связанные проекты

- [rrweb](https://github.com/rrweb-io/rrweb) — Session replay library
- [rrdom](https://github.com/rrweb-io/rrdom) — Virtual DOM for rrweb

---

## 📝 Changelog

### v1.0 (2025-01-15) — Specification Phase

- ✅ Requirements defined
- ✅ Specification complete
- ✅ Architecture designed
- ✅ Decisions documented

---

**🚀 Ready to dive in?** Start with [REQUIREMENTS.md](./REQUIREMENTS.md)
