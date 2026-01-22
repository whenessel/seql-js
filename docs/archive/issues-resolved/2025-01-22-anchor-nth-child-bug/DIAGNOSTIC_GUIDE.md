# Инструкция по дальнейшей диагностике проблемы

## 🔍 БЫСТРАЯ ПРОВЕРКА ПРОБЛЕМЫ

### 1. Проверить структуру EID

```javascript
// В консоли браузера на странице https://appsurify.github.io/modern-seaside-stay/
const element = $x('/html/body/div/div[2]/main/section[2]/div/div/div[2]/div[2]')[0];
const eid = seqljs.generateEID(element);

console.log('=== EID STRUCTURE ===');
console.log('Anchor:', eid.anchor);
console.log('  - tag:', eid.anchor.tag);
console.log('  - semantics:', eid.anchor.semantics);
console.log('  - nthChild:', eid.anchor.nthChild); // ❌ Должно быть undefined (проблема)
console.log('  - degraded:', eid.anchor.degraded);

console.log('Path:', eid.path);
eid.path.forEach((node, i) => {
  console.log(`  [${i}] tag:${node.tag}, nthChild:${node.nthChild}`); // ✅ Есть nthChild
});

console.log('Target:', eid.target);
console.log('  - tag:', eid.target.tag);
console.log('  - nthChild:', eid.target.nthChild); // ✅ Есть nthChild
```

**Ожидаемый результат (до исправления):**

```
anchor.nthChild: undefined  ← ПРОБЛЕМА!
path[0].nthChild: 1  ← OK
target.nthChild: 2  ← OK
```

**Ожидаемый результат (после исправления):**

```
anchor.nthChild: 2  ← ИСПРАВЛЕНО!
path[0].nthChild: 1  ← OK
target.nthChild: 2  ← OK
```

---

### 2. Проверить CSS селектор

```javascript
const result = seqljs.buildSelector(eid, { ensureUnique: true });

console.log('=== CSS SELECTOR ===');
console.log('Selector:', result.selector);
console.log('Is Unique:', result.isUnique);
console.log('Used nth-of-type:', result.usedNthOfType);

// Проверить сколько элементов находит
const foundElements = document.querySelectorAll(result.selector);
console.log('Found elements:', foundElements.length);

if (foundElements.length === 1) {
  console.log('Same element:', foundElements[0] === element);
} else if (foundElements.length === 0) {
  console.error('❌ Selector finds 0 elements!');
} else {
  console.error('❌ Selector finds multiple elements:', foundElements.length);
}
```

**Ожидаемый результат (до исправления):**

```
Selector: section:nth-of-type(1) div.container:nth-child(1) div:nth-child(2)
Found elements: 0  ← ПРОБЛЕМА!
```

**Ожидаемый результат (после исправления):**

```
Selector: section:nth-child(2) div.container:nth-child(1) div:nth-child(2)
Found elements: 1  ← ИСПРАВЛЕНО!
Same element: true
```

---

### 3. Проверить DOM позиции вручную

```javascript
// Найти anchor элемент
const xpath = '/html/body/div/div[2]/main/section[2]';
const anchorElement = $x(xpath)[0];

console.log('=== ANCHOR POSITION ===');
console.log('Tag:', anchorElement.tagName.toLowerCase());
console.log('ID:', anchorElement.id);

// Проверить nth-child
const parent = anchorElement.parentElement;
const siblings = Array.from(parent.children);
const nthChild = siblings.indexOf(anchorElement) + 1;
console.log('nth-child:', nthChild); // Должно быть 2

// Проверить nth-of-type
const sameTags = siblings.filter((s) => s.tagName === anchorElement.tagName);
const nthOfType = sameTags.indexOf(anchorElement) + 1;
console.log('nth-of-type:', nthOfType); // Должно быть 2

// Проверить селекторы
console.log('=== SELECTOR TESTS ===');
console.log(
  'section:nth-child(1) finds:',
  document.querySelectorAll('section:nth-child(1)').length
);
console.log(
  'section:nth-child(2) finds:',
  document.querySelectorAll('section:nth-child(2)').length
);
console.log(
  'section:nth-of-type(1) finds:',
  document.querySelectorAll('section:nth-of-type(1)').length
);
console.log(
  'section:nth-of-type(2) finds:',
  document.querySelectorAll('section:nth-of-type(2)').length
);
```

**Ожидаемый результат:**

```
nth-child: 2
nth-of-type: 2
section:nth-child(2) finds: 1  ← Правильный селектор
section:nth-of-type(2) finds: 1  ← Правильный селектор
section:nth-of-type(1) finds: 1  ← Неправильный (но находит ДРУГОЙ section)
```

---

## 🔬 ГЛУБОКАЯ ДИАГНОСТИКА

### Проверить findElementBySemantics

```javascript
// В консоли браузера
const sections = Array.from(document.querySelectorAll('section'));
console.log('Total sections:', sections.length);

sections.forEach((section, i) => {
  console.log(`Section ${i + 1}:`, {
    id: section.id,
    classes: Array.from(section.classList),
    hasSemantics: !!(section.classList.length > 0 || section.id || section.getAttribute('role')),
  });
});
```

**Анализ:**

- Если section#welcome имеет только ID (без других semantics)
- findElementBySemantics вернёт первый section (неправильно)
- Потому что ID уже включён в базовый селектор как `section#welcome`

---

### Проверить ensureUniqueAnchor логику

```javascript
// Эмулировать логику ensureUniqueAnchor
const tag = 'section';
const semantics = { id: 'welcome', classes: ['section'] };

// Step 1: Try just tag
console.log('Step 1 - tag only:', document.querySelectorAll(tag).length);

// Step 2: Try tag with class
const cls = semantics.classes[0];
console.log(`Step 2 - ${tag}.${cls}:`, document.querySelectorAll(`${tag}.${cls}`).length);

// Step 3: Try tag with attribute
console.log(
  `Step 3 - ${tag}#${semantics.id}:`,
  document.querySelectorAll(`${tag}#${semantics.id}`).length
);

// Step 4: Try nth-of-type (ПРОБЛЕМА!)
const allSections = Array.from(document.querySelectorAll(tag));
console.log('Step 4 - All sections:', allSections.length);

// findElementBySemantics возвращает первый, если semantics пустой
const hasSemantics = semantics.classes?.length > 0 || false;
console.log('Has additional semantics:', hasSemantics);

if (!hasSemantics) {
  console.log('❌ findElementBySemantics вернёт первый section (неправильно)');
  const firstSection = allSections[0];
  const parent = firstSection.parentElement;
  const siblings = Array.from(parent.children).filter((s) => s.tagName === 'SECTION');
  const wrongNth = siblings.indexOf(firstSection) + 1;
  console.log('Wrong nth-of-type:', wrongNth); // Будет 1 вместо 2
}
```

---

## 📝 ЧЕКЛИСТ ДИАГНОСТИКИ

- [ ] Проверить что anchor.nthChild === undefined (до исправления)
- [ ] Проверить что path[0].nthChild !== undefined
- [ ] Проверить что target.nthChild !== undefined
- [ ] Проверить что CSS селектор использует nth-of-type(1) (неправильно)
- [ ] Проверить что селектор находит 0 или >1 элементов
- [ ] Проверить что anchor на самом деле nth-child(2)
- [ ] Проверить что section:nth-child(2) находит правильный элемент
- [ ] Проверить что section:nth-of-type(1) находит ДРУГОЙ section

---

## 🚀 ПОСЛЕ ИСПРАВЛЕНИЯ

### Повторить проверки

```javascript
// 1. Проверить что nthChild добавлен
const eid = seqljs.generateEID(element);
console.assert(eid.anchor.nthChild === 2, '✅ anchor.nthChild should be 2');

// 2. Проверить что селектор правильный
const result = seqljs.buildSelector(eid, { ensureUnique: true });
console.assert(
  result.selector.includes('section:nth-child(2)') ||
    result.selector.includes('section:nth-of-type(2)'),
  '✅ Selector should use nth 2'
);

// 3. Проверить что находит правильный элемент
const found = document.querySelectorAll(result.selector);
console.assert(found.length === 1, '✅ Should find exactly 1 element');
console.assert(found[0] === element, '✅ Should find correct element');

console.log('🎉 All checks passed!');
```

---

## 🔗 ССЫЛКИ

- **Тестовая страница:** <https://appsurify.github.io/modern-seaside-stay/>
- **XPath:** `/html/body/div/div[2]/main/section[2]/div/div/div[2]/div[2]`
- **Issue:** `/issues/2025-01-22-anchor-nth-child-bug/ISSUE.md`
- **AI Prompt:** `/issues/2025-01-22-anchor-nth-child-bug/AI_AGENT_PROMPT.md`
