# AI AGENT PROMPT: Исправление nth-child для anchor в CSS генераторе

## 🎯 ЗАДАЧА

Исправить генерацию CSS селекторов в seql-js библиотеке, чтобы anchor элемент использовал корректный nth-child индекс из EID структуры вместо вычисления заново.

---

## 📍 КОНТЕКСТ

### Текущая проблема

CSS селектор генерируется с неправильным `nth-of-type` для anchor элемента:

- **Факт:** `section:nth-of-type(1)` (неправильно)
- **Ожидание:** `section:nth-of-type(2)` или `section:nth-child(2)` (правильно)
- **Результат:** Селектор находит 0 элементов вместо 1

### Корневая причина

1. Anchor node НЕ сохраняет nthChild при генерации EID
2. CSS генератор пытается вычислить nth-of-type заново, что даёт неправильный индекс

---

## 🔧 ЧТО НУЖНО ИСПРАВИТЬ

### 1. Добавить nthChild в anchor node (generator.ts)

**Файл:** `src/generator/generator.ts`
**Строка:** После 71, перед созданием anchorNode

**Текущий код:**

```typescript
// 2. Build anchor node
const anchorSemantics = semanticExtractor.extract(anchorElement);
const anchorNode = {
  tag: anchorElement.tagName.toLowerCase(),
  semantics: anchorSemantics,
  score: anchorResult?.score ?? ANCHOR_SCORE.DEGRADED_SCORE,
  degraded: anchorDegraded,
};
```

**Новый код:**

```typescript
// Calculate nth-child position for anchor (same logic as for target)
const anchorParent = anchorElement.parentElement;
let anchorNthChild: number | undefined;
if (anchorParent) {
  const siblings = Array.from(anchorParent.children);
  const index = siblings.indexOf(anchorElement);
  if (index !== -1) {
    anchorNthChild = index + 1; // 1-based for CSS nth-child()
  }
}

// 2. Build anchor node
const anchorSemantics = semanticExtractor.extract(anchorElement);
const anchorNode = {
  tag: anchorElement.tagName.toLowerCase(),
  semantics: anchorSemantics,
  score: anchorResult?.score ?? ANCHOR_SCORE.DEGRADED_SCORE,
  degraded: anchorDegraded,
  nthChild: anchorNthChild, // ADD THIS
};
```

### 2. Использовать nthChild из EID (css-generator.ts)

**Файл:** `src/resolver/css-generator.ts`
**Метод:** `ensureUniqueAnchor`
**Строка:** После 650

**Текущий код:**

```typescript
// Step 4: Try tag with nth-of-type
// Find all elements with this tag in root
const allAnchors = Array.from(root.querySelectorAll(tag));

if (allAnchors.length > 1) {
  // Need to match by semantics to find the correct anchor
  const matchingAnchor = this.findElementBySemantics(allAnchors, semantics);

  if (matchingAnchor) {
    const nthIndex = this.getNthOfTypeIndex(matchingAnchor, tag);
    if (nthIndex) {
      return `${tag}:nth-of-type(${nthIndex})`;
    }
  }
}
```

**Новый код (добавить ПЕРЕД Step 4):**

```typescript
// Step 3.5: Use nth-child from EID if available (most reliable)
if (eid.anchor.nthChild !== undefined) {
  // Use nth-child instead of nth-of-type for accuracy
  const selectorWithNth = `${tag}:nth-child(${eid.anchor.nthChild})`;
  if (this.isUnique(selectorWithNth, root)) {
    return selectorWithNth;
  }
}

// Step 4: Try tag with nth-of-type (fallback for old EIDs without nthChild)
// ... оставить существующий код без изменений
```

### 3. Обновить TypeScript типы (types/index.ts)

**Файл:** `src/types/index.ts`
**Интерфейс:** `AnchorNode`

**Найти:**

```typescript
export interface AnchorNode {
  tag: string;
  semantics: ElementSemantics;
  score: number;
  degraded: boolean;
}
```

**Изменить на:**

```typescript
export interface AnchorNode {
  tag: string;
  semantics: ElementSemantics;
  score: number;
  degraded: boolean;
  nthChild?: number; // ADD THIS - Position among siblings (1-based)
}
```

---

## ✅ КРИТЕРИИ УСПЕХА

После исправления:

1. ✅ EID для anchor должен содержать `nthChild` (если anchor имеет родителя)
2. ✅ CSS селектор должен использовать `nth-child(2)` для второго section
3. ✅ CSS селектор должен находить ровно 1 элемент
4. ✅ Найденный элемент должен быть правильным (не другим)
5. ✅ Старые EID без nthChild должны работать через fallback

---

## 🧪 КАК ПРОТЕСТИРОВАТЬ

### Автоматический тест

```bash
npm test -- --grep "Anchor with nth-of-type"
```

### Ручное тестирование в браузере

1. Открыть: <https://appsurify.github.io/modern-seaside-stay/>
2. Найти элемент: `$x('/html/body/div/div[2]/main/section[2]/div/div/div[2]/div[2]')[0]`
3. Сгенерировать EID:

```javascript
const element = $x('/html/body/div/div[2]/main/section[2]/div/div/div[2]/div[2]')[0];
const eid = seqljs.generateEID(element);
console.log('Anchor nthChild:', eid.anchor.nthChild); // Должно быть 2
```

Дополнительные проверки:

1. Построить селектор:

```javascript
const result = seqljs.buildSelector(eid, { ensureUnique: true });
console.log('Selector:', result.selector);
// Должен содержать: section:nth-child(2) или section:nth-of-type(2)
```

1. Проверить уникальность:

```javascript
const elements = document.querySelectorAll(result.selector);
console.log('Found elements:', elements.length); // Должно быть 1
console.log('Correct element:', elements[0] === element); // Должно быть true
```

---

## 📋 ЧЕКЛИСТ ВЫПОЛНЕНИЯ

- [ ] Прочитать ISSUE.md для полного понимания проблемы
- [ ] Изучить текущий код в generator.ts и css-generator.ts
- [ ] Добавить вычисление nthChild для anchor в generator.ts
- [ ] Добавить использование eid.anchor.nthChild в ensureUniqueAnchor
- [ ] Обновить AnchorNode интерфейс в types/index.ts
- [ ] Запустить существующие тесты: `npm test`
- [ ] Добавить новый тест для anchor с nth > 1
- [ ] Протестировать на реальной странице (см. выше)
- [ ] Проверить что старые EID работают (fallback)
- [ ] Закоммитить изменения с сообщением: "fix: Add nthChild to anchor node for accurate CSS selector generation"

---

## ⚠️ ВАЖНО

1. **Не ломайте существующие тесты** - запустите `npm test` перед коммитом
2. **Сохраните fallback** - старые EID без nthChild должны работать
3. **Используйте nth-child** - это более точно чем nth-of-type
4. **Комментируйте код** - объясните зачем добавлен nthChild

---

## 📚 ССЫЛКИ НА КОД

- **Generator:** `/Users/whenessel/Development/WebstormProjects/seql-js/src/generator/generator.ts`
- **CSS Generator:** `/Users/whenessel/Development/WebstormProjects/seql-js/src/resolver/css-generator.ts`
- **Types:** `/Users/whenessel/Development/WebstormProjects/seql-js/src/types/index.ts`
- **Path Builder (пример):** `/Users/whenessel/Development/WebstormProjects/seql-js/src/generator/path-builder.ts` (строки 73-88)

---

## 🤖 ПРИМЕР ПРОМПТА ДЛЯ КОПИРОВАНИЯ

```
Исправь генерацию CSS селекторов в seql-js библиотеке:

ПРОБЛЕМА: Anchor элемент использует неправильный nth-of-type индекс, что приводит к CSS селектору который находит 0 элементов.

ПРИЧИНА: Anchor node не сохраняет nthChild при генерации EID, и CSS генератор вычисляет его заново неправильно.

РЕШЕНИЕ:
1. В src/generator/generator.ts (после строки 71) добавь вычисление nthChild для anchor аналогично target:
   - Получи anchorParent
   - Найди index в siblings
   - Сохрани в anchorNode.nthChild

2. В src/resolver/css-generator.ts в методе ensureUniqueAnchor (после строки 650) добавь:
   - Проверку if (eid.anchor.nthChild !== undefined)
   - Возврат selector с nth-child(eid.anchor.nthChild)
   - ПЕРЕД существующим Step 4 (как fallback)

3. В src/types/index.ts добавь nthChild?: number в AnchorNode интерфейс

ТЕСТИРОВАНИЕ:
- npm test должен пройти
- На странице https://appsurify.github.io/modern-seaside-stay/ элемент /html/body/div/div[2]/main/section[2]/div/div/div[2]/div[2] должен находиться по CSS селектору

Файлы для изменения:
- src/generator/generator.ts
- src/resolver/css-generator.ts
- src/types/index.ts
```
