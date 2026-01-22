# Debug: Проблема с неправильными элементами

## Проблема

Селекторы генерируются и находят по 1 элементу (isUnique: true), НО это **неправильные элементы**:

- Селектор для даты 18 → находит ячейку с датой 1
- Селектор для даты 31 (строка 5) → находит дату 31 из строки 1

## XPath для правильных элементов

- Дата 18: `/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]` (строка 4, ячейка 1)
- Дата 31: `/html/body/div[3]/div/div/div/div/table/tbody/tr[5]/td[7]` (строка 5, ячейка 7)

## Скрипт для проверки

Выполните в консоли браузера:

```javascript
console.clear();
console.log('=== DEBUG: Wrong Element Problem ===\n');

// Helper: Get element by XPath
function getByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue;
}

// Helper: Get table position
function getTablePosition(cell) {
  const tr = cell.closest('tr');
  const tbody = cell.closest('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const rowIndex = rows.indexOf(tr);
  const cellsInRow = Array.from(tr.querySelectorAll('td, th, button'));
  const cellIndex = cellsInRow.indexOf(cell);
  return { rowIndex, cellIndex, rowCount: rows.length, cellCount: cellsInRow.length };
}

// Test Date 18
console.log('--- TEST DATE 18 ---');
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const correctCell18 = getByXPath(xpath18);

console.log('✓ Correct element (via XPath):');
console.log('  Text:', correctCell18?.textContent.trim());
console.log('  Tag:', correctCell18?.tagName);
const pos18Correct = getTablePosition(correctCell18);
console.log('  Position: row', pos18Correct.rowIndex + 1, 'cell', pos18Correct.cellIndex + 1);

// Find via domDsl
const cells = Array.from(document.querySelectorAll('.rdp-day'));
const foundCell18 = cells.find((el) => el.textContent.trim() === '18');

console.log('\n✓ Element found by text "18":');
console.log('  Text:', foundCell18?.textContent.trim());
console.log('  Tag:', foundCell18?.tagName);
const pos18Found = getTablePosition(foundCell18);
console.log('  Position: row', pos18Found.rowIndex + 1, 'cell', pos18Found.cellIndex + 1);

// Check if they match
if (correctCell18 === foundCell18) {
  console.log('\n✓ Elements match: YES');
} else {
  console.log('\n✗ Elements match: NO - DIFFERENT ELEMENTS!');
}

// Generate DSL and selector
const dsl18 = window.domDsl.generateDsl(foundCell18);
const cssGen = new window.domDsl.CssGenerator();
const sel18 = cssGen.buildSelector(dsl18, { ensureUnique: true });

console.log('\n✓ Generated selector:', sel18.selector);

// Test selector
const selectorMatches18 = document.querySelectorAll(sel18.selector);
console.log('✓ Selector matches:', selectorMatches18.length, 'element(s)');

if (selectorMatches18.length === 1) {
  const matched = selectorMatches18[0];
  console.log('\n✓ Matched element:');
  console.log('  Text:', matched.textContent.trim());
  const posMatched18 = getTablePosition(matched);
  console.log('  Position: row', posMatched18.rowIndex + 1, 'cell', posMatched18.cellIndex + 1);

  // Compare all three
  console.log('\n📊 COMPARISON:');
  console.log(
    '  XPath element (correct):  row',
    pos18Correct.rowIndex + 1,
    'cell',
    pos18Correct.cellIndex + 1,
    '→ text "' + correctCell18.textContent.trim() + '"'
  );
  console.log(
    '  Found by text "18":       row',
    pos18Found.rowIndex + 1,
    'cell',
    pos18Found.cellIndex + 1,
    '→ text "' + foundCell18.textContent.trim() + '"'
  );
  console.log(
    '  Matched by selector:      row',
    posMatched18.rowIndex + 1,
    'cell',
    posMatched18.cellIndex + 1,
    '→ text "' + matched.textContent.trim() + '"'
  );

  if (matched === foundCell18 && foundCell18 === correctCell18) {
    console.log('\n✅ PASS: All three are the same element');
  } else if (matched === foundCell18) {
    console.log('\n⚠️  Selector matches the input element, but input is WRONG!');
  } else {
    console.log('\n❌ FAIL: Selector matches different element!');
  }
}

console.log('\n' + '='.repeat(70) + '\n');

// Test Date 31
console.log('--- TEST DATE 31 ---');
const xpath31 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[5]/td[7]';
const correctCell31 = getByXPath(xpath31);

console.log('✓ Correct element (via XPath):');
console.log('  Text:', correctCell31?.textContent.trim());
console.log('  Tag:', correctCell31?.tagName);
const pos31Correct = getTablePosition(correctCell31);
console.log('  Position: row', pos31Correct.rowIndex + 1, 'cell', pos31Correct.cellIndex + 1);

// Find via domDsl
const foundCell31 = cells.find((el) => el.textContent.trim() === '31');

console.log('\n✓ Element found by text "31":');
console.log('  Text:', foundCell31?.textContent.trim());
console.log('  Tag:', foundCell31?.tagName);
const pos31Found = getTablePosition(foundCell31);
console.log('  Position: row', pos31Found.rowIndex + 1, 'cell', pos31Found.cellIndex + 1);

// Check if they match
if (correctCell31 === foundCell31) {
  console.log('\n✓ Elements match: YES');
} else {
  console.log('\n✗ Elements match: NO - DIFFERENT ELEMENTS!');
}

// Generate DSL and selector
const dsl31 = window.domDsl.generateDsl(foundCell31);
const sel31 = cssGen.buildSelector(dsl31, { ensureUnique: true });

console.log('\n✓ Generated selector:', sel31.selector);

// Test selector
const selectorMatches31 = document.querySelectorAll(sel31.selector);
console.log('✓ Selector matches:', selectorMatches31.length, 'element(s)');

if (selectorMatches31.length === 1) {
  const matched = selectorMatches31[0];
  console.log('\n✓ Matched element:');
  console.log('  Text:', matched.textContent.trim());
  const posMatched31 = getTablePosition(matched);
  console.log('  Position: row', posMatched31.rowIndex + 1, 'cell', posMatched31.cellIndex + 1);

  // Compare all three
  console.log('\n📊 COMPARISON:');
  console.log(
    '  XPath element (correct):  row',
    pos31Correct.rowIndex + 1,
    'cell',
    pos31Correct.cellIndex + 1,
    '→ text "' + correctCell31.textContent.trim() + '"'
  );
  console.log(
    '  Found by text "31":       row',
    pos31Found.rowIndex + 1,
    'cell',
    pos31Found.cellIndex + 1,
    '→ text "' + foundCell31.textContent.trim() + '"'
  );
  console.log(
    '  Matched by selector:      row',
    posMatched31.rowIndex + 1,
    'cell',
    posMatched31.cellIndex + 1,
    '→ text "' + matched.textContent.trim() + '"'
  );

  if (matched === foundCell31 && foundCell31 === correctCell31) {
    console.log('\n✅ PASS: All three are the same element');
  } else if (matched === foundCell31) {
    console.log('\n⚠️  Selector matches the input element, but input is WRONG!');
  } else {
    console.log('\n❌ FAIL: Selector matches different element!');
  }
}

console.log('\n' + '='.repeat(70));
```

## Возможные причины

### 1. Проблема с поиском элемента по тексту

Календарь может содержать несколько кнопок с текстом "18" или "31":

- Предыдущий месяц (серые даты)
- Текущий месяц
- Следующий месяц (серые даты)

### 2. Проблема со структурой календаря

Возможно calendar имеет сложную структуру где:

- `<button>` находится внутри `<td>`
- XPath указывает на `<td>`, а `.rdp-day` находит `<button>`

### 3. Проблема с nth-child индексами

Возможно расчет позиции элемента неверен из-за:

- Header row (`<thead>`)
- Скрытых элементов
- Неучтенных wrapper элементов

## Что проверить

1. **Правильно ли находится элемент** - XPath vs querySelector
2. **Структура DOM** - что находится внутри `<td>`
3. **Генерация пути** - какие элементы включены в path
4. **Расчет nth-child** - правильные ли индексы

## Скрипт для детальной инспекции DOM

```javascript
// Detailed DOM inspection
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const cell = document.evaluate(
  xpath18,
  document,
  null,
  XPathResult.FIRST_ORDERED_NODE_TYPE,
  null
).singleNodeValue;

console.log('=== DOM Structure for Date 18 ===');
console.log('TD element:', cell);
console.log('TD.tagName:', cell.tagName);
console.log('TD.textContent:', cell.textContent.trim());
console.log('TD.children:', cell.children);
console.log('TD.querySelector(".rdp-day"):', cell.querySelector('.rdp-day'));

// Check button inside
const button = cell.querySelector('button');
console.log('\nButton inside TD:');
console.log('  button:', button);
console.log('  button.textContent:', button?.textContent.trim());
console.log('  button.className:', button?.className);

// Compare
const foundByClass = Array.from(document.querySelectorAll('.rdp-day')).find(
  (el) => el.textContent.trim() === '18'
);

console.log('\nFound by .rdp-day class:');
console.log('  element:', foundByClass);
console.log('  Same as button in TD:', foundByClass === button);
console.log('  Parent TD:', foundByClass?.parentElement);
console.log('  Parent TD same as XPath TD:', foundByClass?.parentElement === cell);
```

---

**Следующие шаги:**

1. Выполнить debug скрипт в консоли
2. Определить точную причину несоответствия
3. Исправить логику генерации селекторов
