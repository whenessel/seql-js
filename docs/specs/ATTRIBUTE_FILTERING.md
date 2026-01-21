# Attribute Filtering — Stable Identity vs State

**Version**: 1.0.3
**Date**: 2026-01-21
**Status**: Implemented

---

## Overview

SEQL (Semantic Element Query Language) идентифицирует DOM элементы по их **семантической идентичности**, а не по **текущему состоянию**. Это означает, что селектор должен находить элемент независимо от того, активен он или нет, видим или скрыт, развернут или свернут.

### Problem Statement

До версии 1.0.3, SEQL включал в селекторы атрибуты состояния:

```typescript
// Генерируется EID для активной вкладки
<button
  role="tab"
  aria-label="Settings"
  aria-selected="true"     // ← состояние
  data-state="active"      // ← состояние
>

// EID включает: aria-selected="true", data-state="active"
```

**Проблема:** При переключении вкладки:
```typescript
<button
  role="tab"
  aria-label="Settings"
  aria-selected="false"    // ← изменилось
  data-state="inactive"    // ← изменилось
>

// Прежний селектор больше не находит элемент ❌
```

### Solution

Система классификации атрибутов на:
1. **Stable attributes** — описывают идентичность элемента
2. **State attributes** — описывают текущее состояние элемента

Только **stable attributes** включаются в EID.

---

## Attribute Classification

### ARIA Attributes

#### Stable (Identity)

Атрибуты, описывающие семантику и роль элемента:

```typescript
role                  // роль элемента
aria-label            // метка элемента
aria-labelledby       // ссылка на метку
aria-describedby      // ссылка на описание
aria-controls         // связь с контролируемым элементом
aria-owns             // владение другими элементами
aria-level            // уровень в иерархии (headings, tree)
aria-posinset         // позиция в наборе (статическая)
aria-setsize          // размер набора (статический)
aria-haspopup         // наличие popup (capability, не state)
```

**Примеры:**
```html
<!-- Стабильные ARIA атрибуты -->
<button role="tab" aria-label="Settings">
<nav role="navigation" aria-label="Main menu">
<h2 aria-level="2">Section Title</h2>
<div role="listitem" aria-posinset="3" aria-setsize="10">
```

#### State (Transient)

Атрибуты, описывающие временное состояние:

```typescript
aria-selected         // выбран/не выбран
aria-checked          // отмечен/не отмечен (checkbox)
aria-pressed          // нажат/не нажат (toggle button)
aria-expanded         // развернут/свернут
aria-hidden           // скрыт/виден
aria-disabled         // отключен/включен
aria-current          // текущий элемент
aria-busy             // загружается/загружен
aria-invalid          // валидация (valid/invalid)
aria-grabbed          // drag & drop состояние
aria-live             // live region update
aria-atomic           // atomic update flag
```

**Примеры:**
```html
<!-- Нестабильные ARIA атрибуты (исключаются) -->
<button aria-selected="true">     <!-- меняется при клике -->
<div aria-expanded="false">       <!-- меняется при раскрытии -->
<input aria-invalid="true">       <!-- меняется при валидации -->
<span aria-hidden="true">         <!-- меняется при показе/скрытии -->
```

---

### data-* Attributes

#### State Attributes (Excluded)

Общие паттерны состояния:

```typescript
data-state            // active/inactive/pending/error
data-active           // true/false
data-inactive         // true/false
data-selected         // true/false
data-open             // true/false (modal, dropdown)
data-closed           // true/false
data-visible          // true/false
data-hidden           // true/false
data-disabled         // true/false
data-enabled          // true/false
data-loading          // true/false
data-error            // true/false
data-success          // true/false
data-highlighted      // true/false
data-focused          // true/false
data-hover            // true/false
data-orientation      // horizontal/vertical (layout state)
data-theme            // light/dark (UI state)
```

**Примеры:**
```html
<!-- Исключаются -->
<div data-state="active">
<button data-selected="true">
<modal data-open="true">
<input data-loading="false">
```

#### Library Prefixes (Excluded)

Атрибуты, генерируемые UI библиотеками:

```typescript
data-radix-*          // Radix UI
data-headlessui-*     // Headless UI
data-reach-*          // Reach UI
data-mui-*            // Material UI
data-chakra-*         // Chakra UI
data-mantine-*        // Mantine
data-tw-*             // Tailwind Merge
```

**Примеры:**
```html
<!-- Исключаются -->
<div data-radix-collection-item>
<div data-radix-scroll-area-viewport>
<button data-headlessui-state="open">
<span data-mui-color-scheme="light">
```

**Обоснование:**
- Эти атрибуты генерируются библиотеками для внутренних целей
- Часто меняются между версиями библиотек
- Не несут семантической информации об элементе
- Могут содержать состояние (state) или технические ID

#### ID Patterns (Included)

Атрибуты, представляющие стабильные идентификаторы:

```typescript
// Точное совпадение
data-testid           // Testing Library
data-test-id          // альтернативное название
data-test             // краткая форма
data-cy               // Cypress
data-qa               // QA automation
data-automation-id    // automation ID
data-id               // общий ID
data-component        // имя компонента
data-entity-id        // ID сущности (user, product, etc.)
data-product-id       // ID продукта
data-user-id          // ID пользователя

// Паттерн: заканчивается на -id
data-*-id             // любой атрибут, заканчивающийся на -id
```

**Примеры:**
```html
<!-- Включаются -->
<button data-testid="submit-button">
<div data-cy="user-profile">
<span data-product-id="12345">
<form data-tracking-id="checkout-form">
```

#### Generic data-* (Included by default)

Остальные `data-*` атрибуты включаются по умолчанию (blacklist approach):

```html
<!-- Включаются (если не в blacklist) -->
<div data-category="electronics">
<button data-action="submit">
<span data-section="header">
```

**Обоснование:**
- Разработчики могут использовать кастомные `data-*` для идентификации
- Безопаснее включить неизвестный атрибут, чем исключить нужный
- Blacklist защищает от известных паттернов состояния

---

### HTML Standard Attributes

#### Stable (Identity)

Атрибуты, описывающие назначение элемента:

```typescript
id                    // ID элемента (если стабилен, см. ниже)
name                  // имя поля формы
type                  // тип элемента (input type, button type)
placeholder           // подсказка в поле
title                 // tooltip текст
for                   // связь label с input
alt                   // альтернативный текст (img)
href                  // ссылка (a, link)
```

**Примеры:**
```html
<!-- Стабильные HTML атрибуты -->
<input name="email" type="email" placeholder="Enter email">
<button type="submit" title="Submit form">
<label for="email-input">
<a href="/home">
```

#### State (Transient)

Атрибуты, описывающие состояние формы/элемента:

```typescript
disabled              // отключен/включен
checked               // отмечен (checkbox/radio)
selected              // выбран (option)
hidden                // скрыт (HTML5 hidden)
readonly              // только чтение
required              // обязательное поле
value                 // текущее значение input
```

**Примеры:**
```html
<!-- Нестабильные HTML атрибуты (исключаются) -->
<input disabled>
<input checked>
<option selected>
<div hidden>
<input value="current-text">
```

---

### ID Attribute Special Case

Атрибут `id` обрабатывается особым образом.

#### Stable IDs (Included)

Пользовательские, семантические ID:

```html
<!-- Стабильные ID (включаются) -->
<div id="main-nav">
<form id="login-form">
<button id="submit-button">
<section id="user-profile">
```

**Признаки стабильного ID:**
- Читаемое имя
- Семантическое значение
- Установлено разработчиком вручную

#### Generated IDs (Excluded)

ID, генерируемые UI фреймворками:

```typescript
// Паттерны генерируемых ID
/^radix-/             // Radix UI: radix-:ru:-trigger
/^headlessui-/        // Headless UI: headlessui-menu-1
/^mui-/               // Material UI: mui-12345
/:\w+:/               // React 18 pattern: :r1:, :ru:
```

**Примеры:**
```html
<!-- Генерируемые ID (исключаются) -->
<div id="radix-:ru:-trigger-card">
<div id="headlessui-menu-1">
<input id="mui-text-field-42">
<button id=":r1:">
```

**Обоснование:**
- Генерируемые ID меняются при ререндере
- Не несут семантической информации
- Зависят от порядка рендера
- Не стабильны между сессиями

---

## Implementation

### Module: `src/utils/attribute-filters.ts`

```typescript
/**
 * Determines if an attribute represents stable element identity
 * @param name - attribute name
 * @param value - attribute value
 * @returns true if attribute should be included in SEQL selector
 */
export function isStableAttribute(name: string, value: string): boolean {
  // 1. Whitelist stable ARIA attributes
  if (ARIA_STABLE_ATTRIBUTES.includes(name)) return true;

  // 2. Blacklist ARIA state attributes
  if (ARIA_STATE_ATTRIBUTES.includes(name)) return false;

  // 3. Blacklist data-* state attributes
  if (DATA_STATE_ATTRIBUTES.includes(name)) return false;

  // 4. Blacklist library-specific data-* prefixes
  if (LIBRARY_DATA_PREFIXES.some(prefix => name.startsWith(prefix))) {
    return false;
  }

  // 5. Whitelist data-* ID patterns (exact match)
  if (DATA_ID_PATTERNS.includes(name)) return true;

  // 6. Whitelist data-* ending with -id
  if (name.startsWith('data-') && name.endsWith('-id')) return true;

  // 7. Filter generated IDs by pattern
  if (name === 'id') {
    if (GENERATED_ID_PATTERNS.some(pattern => pattern.test(value))) {
      return false;
    }
    return true;
  }

  // 8. Whitelist stable HTML attributes
  if (HTML_STABLE_ATTRIBUTES.includes(name)) return true;

  // 9. Blacklist HTML state attributes
  if (HTML_STATE_ATTRIBUTES.includes(name)) return false;

  // 10. Allow other data-* attributes by default (blacklist approach)
  if (name.startsWith('data-')) return true;

  // 11. Reject unknown attributes
  return false;
}
```

### Integration: `src/generator/semantic-extractor.ts`

```typescript
import { isStableAttribute } from '../utils/attribute-filters';

class SemanticExtractor {
  private extractAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name;

      // Skip ignored attributes (id, class, style handled separately)
      if (this.shouldIgnoreAttribute(name)) continue;

      // ✨ NEW: Skip unstable/state-based attributes
      if (!isStableAttribute(name, attr.value)) continue;

      // Skip ID-reference attributes with dynamic IDs
      if (ID_REFERENCE_ATTRIBUTES.has(name) && hasDynamicIdReference(attr.value)) {
        continue;
      }

      // Get priority
      const priority = this.getAttributePriority(name);
      if (priority === 0) continue;

      // ... rest of processing
      attrs[name] = attr.value;
    }

    return attrs;
  }
}
```

---

## Examples

### Example 1: Tab Component

**HTML:**
```html
<div role="tablist">
  <button
    role="tab"
    aria-label="Profile"
    aria-selected="true"
    aria-controls="profile-panel"
    data-state="active"
    data-testid="profile-tab"
  >
    Profile
  </button>
</div>
```

**Generated EID (v1.0.3):**
```json
{
  "target": {
    "tag": "button",
    "semantics": {
      "attributes": {
        "role": "tab",                    // ✅ stable ARIA
        "aria-label": "Profile",          // ✅ stable ARIA
        "aria-controls": "profile-panel", // ✅ stable ARIA
        "data-testid": "profile-tab"      // ✅ test ID
        // aria-selected: excluded ❌
        // data-state: excluded ❌
      },
      "text": {
        "raw": "Profile",
        "normalized": "profile"
      }
    }
  }
}
```

**Benefits:**
- Селектор работает независимо от `aria-selected="true"` или `"false"`
- Селектор работает независимо от `data-state="active"` или `"inactive"`

---

### Example 2: Form Input

**HTML:**
```html
<form id="login-form">
  <input
    name="email"
    type="email"
    placeholder="Enter your email"
    required
    disabled
    value="user@example.com"
    data-testid="email-input"
  >
</form>
```

**Generated EID (v1.0.3):**
```json
{
  "target": {
    "tag": "input",
    "semantics": {
      "attributes": {
        "name": "email",                  // ✅ stable HTML
        "type": "email",                  // ✅ stable HTML
        "placeholder": "Enter your email", // ✅ stable HTML
        "data-testid": "email-input"      // ✅ test ID
        // required: excluded ❌
        // disabled: excluded ❌
        // value: excluded ❌
      }
    }
  }
}
```

**Benefits:**
- Поле найдется независимо от `disabled`/`enabled` состояния
- Поле найдется независимо от текущего `value`
- Поле найдется независимо от `required` валидации

---

### Example 3: Radix UI Dialog

**HTML:**
```html
<div
  id="radix-:ru:-content"
  role="dialog"
  aria-label="Settings"
  aria-modal="true"
  data-radix-dialog-content
  data-state="open"
  data-orientation="vertical"
>
  Settings Content
</div>
```

**Generated EID (v1.0.3):**
```json
{
  "target": {
    "tag": "div",
    "semantics": {
      "attributes": {
        "role": "dialog",           // ✅ stable ARIA
        "aria-label": "Settings"    // ✅ stable ARIA
        // id: excluded (generated) ❌
        // aria-modal: excluded (state) ❌
        // data-radix-*: excluded (library) ❌
        // data-state: excluded (state) ❌
        // data-orientation: excluded (state) ❌
      },
      "text": {
        "raw": "Settings Content",
        "normalized": "settings content"
      }
    }
  }
}
```

**Benefits:**
- Независимость от Radix UI внутренних атрибутов
- Независимость от сгенерированного ID
- Фокус на семантике: это диалог с меткой "Settings"

---

## Testing

### Test Coverage

**Unit Tests:** `tests/unit/attribute-filtering.test.ts`
- 17 тестов, 100% покрытие
- Категории:
  - ARIA attributes (stable vs state)
  - data-* attributes (state, library, IDs)
  - HTML attributes (stable vs state)
  - ID filtering (generated vs stable)
  - Edge cases

**Integration Tests:** `tests/integration/generator-attribute-filtering.test.ts`
- 14 тестов
- Сценарии:
  - Исключение state атрибутов из EID
  - Исключение библиотечных атрибутов
  - Включение test ID атрибутов
  - Фильтрация сгенерированных ID
  - Комплексные сценарии

**Regression Tests:**
- ✅ Все 255 существующих тестов проходят
- ✅ Нет breaking changes в существующей функциональности

---

## Decision Log

### Why Blacklist Approach for data-*?

**Решение:** Использовать blacklist (исключать известные паттерны состояния), а не whitelist (включать только известные).

**Обоснование:**
1. Разработчики используют кастомные `data-*` для идентификации
2. Невозможно предугадать все кастомные атрибуты
3. Безопаснее включить неизвестный, чем исключить нужный
4. Blacklist защищает от известных антипаттернов

**Альтернатива (отвергнута):**
- Whitelist: включать только `data-testid`, `data-cy`, etc.
- Проблема: исключит легитимные `data-product-id`, `data-entity-type`, etc.

---

### Why Exclude Library Prefixes?

**Решение:** Исключать атрибуты с префиксами `data-radix-*`, `data-headlessui-*`, etc.

**Обоснование:**
1. Библиотеки генерируют эти атрибуты для внутренних целей
2. Атрибуты часто меняются между версиями
3. Не несут семантической информации об элементе
4. Могут содержать состояние или технические детали

**Примеры нестабильности:**
```html
<!-- v1 библиотеки -->
<div data-radix-collection-item>

<!-- v2 библиотеки -->
<div data-radix-collection-member>  <!-- название изменилось -->
```

---

### Why Include aria-haspopup but Exclude aria-expanded?

**Вопрос:** Оба связаны с popup, почему один стабильный, а другой — нет?

**Ответ:**
- `aria-haspopup` — описывает **capability**: "у этого элемента ЕСТЬ popup"
  - Это свойство элемента, часть его идентичности
  - Не меняется при взаимодействии

- `aria-expanded` — описывает **state**: "popup СЕЙЧАС открыт/закрыт"
  - Это временное состояние
  - Меняется при каждом открытии/закрытии

**Аналогия:**
```typescript
// Capability (identity)
const button = {
  hasPopup: true  // ✅ стабильно
};

// State (transient)
const button = {
  isExpanded: false  // ❌ меняется при клике
};
```

---

### Why value is State?

**Вопрос:** Почему `value` атрибут считается state, а не identity?

**Ответ:**
- `value` представляет **текущее содержимое** input поля
- Меняется при каждом вводе пользователя
- Не является частью идентичности поля

**Идентичность input:**
```html
<input name="email" type="email" placeholder="Enter email">
```

**Состояние input:**
```html
<input value="user@example.com">  <!-- текущее значение -->
```

**Исключение:** `value` для `<button>` может быть стабильным, но для упрощения исключаем везде.

---

## Migration Guide

### Breaking Changes

⚠️ **EID для элементов с state-атрибутами изменится**

**До v1.0.3:**
```json
{
  "attributes": {
    "role": "tab",
    "aria-selected": "true",
    "data-state": "active",
    "disabled": ""
  }
}
```

**После v1.0.3:**
```json
{
  "attributes": {
    "role": "tab"
  }
}
```

### Recommended Actions

1. **Перегенерировать все EID:**
   ```typescript
   // Для существующих элементов
   const newEID = generateEID(element);
   ```

2. **Обновить stored EID в аналитике:**
   ```typescript
   // Migrация в БД
   UPDATE analytics_events
   SET element_id = regenerate_eid(element_html)
   WHERE version < '1.0.3';
   ```

3. **Пересчитать агрегации:**
   - Heatmaps могут показывать другие группировки
   - Тренды могут иметь разрыв на дате миграции

### Backward Compatibility Strategy

Если нужна обратная совместимость:

```typescript
// Генерировать оба варианта
const eidNew = generateEID(element, { version: '1.0.3' });
const eidOld = generateEID(element, { version: '1.0.2' });

// Отправлять оба
analytics.track('click', {
  element_id_v3: eidNew,
  element_id_v2: eidOld  // для совместимости
});
```

---

## Performance Impact

### Generation Performance

**Измерения:**
- До v1.0.3: ~1.24ms per element
- После v1.0.3: ~1.77ms per element
- **Overhead: +0.53ms (+43%)**

**Причина:** Дополнительная проверка `isStableAttribute()` для каждого атрибута.

**Оптимизация:** Возможна мемоизация результатов для повторяющихся атрибутов.

### Resolution Performance

**Нет изменений** — resolver не затронут.

---

## Future Considerations

### Potential Improvements

1. **Configuration:**
   ```typescript
   generateEID(element, {
     attributeFiltering: {
       includeLibraryPrefixes: ['data-my-app-'],
       excludeCustom: ['data-tmp-*']
     }
   });
   ```

2. **Custom Classifiers:**
   ```typescript
   registerAttributeClassifier('data-custom', (value) => {
     return !value.includes('temp');
   });
   ```

3. **Versioned Strategies:**
   ```typescript
   // Разные стратегии для разных версий
   filterAttributes(attrs, { strategy: 'v1.0.3' });
   ```

---

## FAQ

### Q: Что если мой кастомный `data-*` атрибут состояния не в списке?

**A:** Он будет включен. Используйте стандартные имена из `DATA_STATE_ATTRIBUTES` или добавьте свой в blacklist.

### Q: Как идентифицировать элементы без стабильных атрибутов?

**A:** SEQL использует fallback на tag + text + position. См. SPECIFICATION.md § 12.

### Q: Почему не использовать ML для определения стабильности?

**A:** SEQL требует детерминированности. ML внесет недетерминированность.

### Q: Как обрабатываются Shadow DOM атрибуты?

**A:** Shadow DOM пока не поддерживается в v1.0. Планируется в v2.0.

---

## References

- [SPECIFICATION.md](./SPECIFICATION.md) — полная спецификация SEQL
- [ARCHITECTURE.md](./ARCHITECTURE.md) — архитектура системы
- [SEQL_IMPROVEMENTS_SUMMARY.md](./SEQL_IMPROVEMENTS_SUMMARY.md) — список всех улучшений

---

**Status:** ✅ Implemented
**Version:** 1.0.3
**Last Updated:** 2026-01-21
