# Исправленный тестовый скрипт

## Проблема

Класс `.rdp-day` НЕ СУЩЕСТВУЕТ в календаре. Нужно использовать правильный селектор.

## Правильная структура

```html
<td role="presentation">
  <button name="day" role="gridcell" class="rdp-button_reset rdp-button ...">18</button>
</td>
```

## Исправленный тест

```javascript
console.clear();
console.log('=== FIXED TEST: Date Picker with Correct Selectors ===\n');

// Helper: Get element by XPath
function getByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue;
}

// ===== TEST DATE 18 =====
console.log('--- TEST DATE 18 ---\n');

// 1. Get correct element via XPath (reference)
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const correctTd18 = getByXPath(xpath18);
const correctButton18 = correctTd18.querySelector('button');

console.log('✓ Correct element (via XPath):');
console.log('  TD:', correctTd18);
console.log('  Button:', correctButton18);
console.log('  Button text:', correctButton18.textContent.trim());

// 2. Find element using CORRECT selector
const allButtons = Array.from(document.querySelectorAll('button[role="gridcell"]'));
console.log('\n✓ Total buttons with role="gridcell":', allButtons.length);

// Find by text (should find multiple if there are duplicate dates)
const buttonsWithText18 = allButtons.filter((btn) => btn.textContent.trim() === '18');
console.log('✓ Buttons with text "18":', buttonsWithText18.length);

buttonsWithText18.forEach((btn, idx) => {
  const td = btn.closest('td');
  const tr = td.closest('tr');
  const tbody = tr.closest('tbody');
  const rowIdx = Array.from(tbody.children).indexOf(tr);
  const cellIdx = Array.from(tr.children).indexOf(td);
  console.log(
    `  [${idx}] Row ${rowIdx + 1}, Cell ${cellIdx + 1}, Text: "${btn.textContent.trim()}"`
  );
});

// 3. Find the one in active month (not disabled/outside)
const activeButton18 = allButtons.find((btn) => {
  const text = btn.textContent.trim();
  const isDisabled = btn.disabled || btn.hasAttribute('disabled');
  const hasOutsideClass = btn.className.includes('outside') || btn.className.includes('disabled');
  return text === '18' && !isDisabled && !hasOutsideClass;
});

console.log('\n✓ Active button (filtered):');
console.log('  Button:', activeButton18);
console.log('  Same as XPath button:', activeButton18 === correctButton18);

// 4. Generate DSL with CORRECT element
if (activeButton18) {
  console.log('\n--- DSL Generation ---');
  const dsl18 = window.domDsl.generateDsl(activeButton18);
  console.log('✓ DSL generated');
  console.log('  Anchor:', dsl18.anchor.tag);
  console.log('  Path length:', dsl18.path.length);
  console.log('  Target:', dsl18.target.tag);

  // 5. Generate CSS selector
  const cssGen = new window.domDsl.CssGenerator();
  const sel18 = cssGen.buildSelector(dsl18, { ensureUnique: true, root: document });

  console.log('\n--- CSS Selector ---');
  console.log('✓ Selector:', sel18.selector);
  console.log('  Is unique:', sel18.isUnique);
  console.log('  Used nth-of-type:', sel18.usedNthOfType);

  // 6. Test selector
  const matches18 = document.querySelectorAll(sel18.selector);
  console.log('\n--- Selector Test ---');
  console.log('✓ Matches found:', matches18.length);

  if (matches18.length === 1) {
    const matched = matches18[0];
    const matchedText = matched.textContent.trim();
    const isCorrect = matched === activeButton18 && matched === correctButton18;

    console.log('✓ Matched element:');
    console.log('  Text:', matchedText);
    console.log('  Same as input:', matched === activeButton18);
    console.log('  Same as XPath:', matched === correctButton18);

    if (isCorrect) {
      console.log('\n✅ PASS: Selector is unique and matches correct element!');
    } else {
      console.error('\n❌ FAIL: Selector matched wrong element');
    }
  } else {
    console.error('\n❌ FAIL: Selector is not unique, found', matches18.length, 'elements');
  }

  // 7. Resolve DSL back
  console.log('\n--- DSL Resolution ---');
  const result18 = window.domDsl.resolveDsl(dsl18, document);
  console.log('✓ Status:', result18.status);
  console.log('  Elements:', result18.elements.length);
  console.log('  Confidence:', result18.confidence);

  if (result18.elements.length === 1 && result18.elements[0] === correctButton18) {
    console.log('  ✅ Resolves to correct element');
  } else {
    console.error('  ❌ Resolution incorrect');
  }
}

console.log('\n' + '='.repeat(70) + '\n');

// ===== TEST DATE 31 =====
console.log('--- TEST DATE 31 ---\n');

// 1. Get correct element via XPath
const xpath31 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[5]/td[7]';
const correctTd31 = getByXPath(xpath31);
const correctButton31 = correctTd31.querySelector('button');

console.log('✓ Correct element (via XPath):');
console.log('  Button text:', correctButton31.textContent.trim());

// 2. Find by text
const buttonsWithText31 = allButtons.filter((btn) => btn.textContent.trim() === '31');
console.log('\n✓ Buttons with text "31":', buttonsWithText31.length);

buttonsWithText31.forEach((btn, idx) => {
  const td = btn.closest('td');
  const tr = td.closest('tr');
  const tbody = tr.closest('tbody');
  const rowIdx = Array.from(tbody.children).indexOf(tr);
  const cellIdx = Array.from(tr.children).indexOf(td);
  console.log(
    `  [${idx}] Row ${rowIdx + 1}, Cell ${cellIdx + 1}, Text: "${btn.textContent.trim()}"`
  );
});

// 3. Filter active
const activeButton31 = allButtons.find((btn) => {
  const text = btn.textContent.trim();
  const isDisabled = btn.disabled || btn.hasAttribute('disabled');
  const hasOutsideClass = btn.className.includes('outside') || btn.className.includes('disabled');

  // For 31, we need to check it's in the last row (row 5)
  if (text === '31' && !isDisabled && !hasOutsideClass) {
    const td = btn.closest('td');
    const tr = td.closest('tr');
    const tbody = tr.closest('tbody');
    const rowIdx = Array.from(tbody.children).indexOf(tr);
    return rowIdx === 4; // Row 5 (0-indexed)
  }
  return false;
});

console.log('\n✓ Active button in row 5 (filtered):');
console.log('  Button:', activeButton31);
console.log('  Same as XPath button:', activeButton31 === correctButton31);

// 4. Generate DSL
if (activeButton31) {
  console.log('\n--- DSL Generation ---');
  const dsl31 = window.domDsl.generateDsl(activeButton31);
  console.log('✓ DSL generated');

  // 5. Generate CSS selector
  const cssGen = new window.domDsl.CssGenerator();
  const sel31 = cssGen.buildSelector(dsl31, { ensureUnique: true, root: document });

  console.log('\n--- CSS Selector ---');
  console.log('✓ Selector:', sel31.selector);
  console.log('  Is unique:', sel31.isUnique);

  // 6. Test selector
  const matches31 = document.querySelectorAll(sel31.selector);
  console.log('\n--- Selector Test ---');
  console.log('✓ Matches found:', matches31.length);

  if (matches31.length === 1) {
    const matched = matches31[0];
    const isCorrect = matched === activeButton31 && matched === correctButton31;

    console.log('✓ Matched element text:', matched.textContent.trim());
    console.log('  Same as input:', matched === activeButton31);
    console.log('  Same as XPath:', matched === correctButton31);

    if (isCorrect) {
      console.log('\n✅ PASS: Selector is unique and matches correct element!');
    } else {
      console.error('\n❌ FAIL: Selector matched wrong element');
    }
  } else {
    console.error('\n❌ FAIL: Selector is not unique');
  }

  // 7. Resolve DSL
  console.log('\n--- DSL Resolution ---');
  const result31 = window.domDsl.resolveDsl(dsl31, document);
  console.log('✓ Status:', result31.status);
  console.log('  Elements:', result31.elements.length);

  if (result31.elements.length === 1 && result31.elements[0] === correctButton31) {
    console.log('  ✅ Resolves to correct element');
  } else {
    console.error('  ❌ Resolution incorrect');
  }
}

console.log('\n' + '='.repeat(70));
console.log('TEST COMPLETE');
console.log('='.repeat(70));
```

## Ключевые изменения

### 1. Правильный селектор

```javascript
// БЫЛО (неправильно):
document.querySelectorAll('.rdp-day');

// СТАЛО (правильно):
document.querySelectorAll('button[role="gridcell"]');
```

### 2. Фильтрация активных дат

```javascript
const activeButton = allButtons.find((btn) => {
  const text = btn.textContent.trim();
  const isDisabled = btn.disabled || btn.hasAttribute('disabled');
  const hasOutsideClass = btn.className.includes('outside') || btn.className.includes('disabled');
  return text === '18' && !isDisabled && !hasOutsideClass;
});
```

### 3. Дополнительная проверка для даты 31

```javascript
// Для 31 проверяем что это строка 5 (не строка 1)
const rowIdx = Array.from(tbody.children).indexOf(tr);
return rowIdx === 4; // Row 5 (0-indexed)
```

## Выполнение

Скопируйте весь скрипт выше и выполните в консоли браузера.

Ожидаемый результат:

- ✅ Найдет правильные кнопки по XPath
- ✅ Найдет те же кнопки через правильный селектор
- ✅ DSL сгенерируется для правильного элемента
- ✅ CSS селектор будет уникальным
- ✅ Селектор найдет ровно тот же элемент
