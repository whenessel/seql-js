# Упрощенный прямой тест

## Проблема

Фильтр возвращает `undefined`, хотя кнопки найдены. Нужно проверить атрибуты кнопок.

## Скрипт для диагностики

```javascript
console.clear();
console.log('=== SIMPLE DIRECT TEST ===\n');

// Helper
function getByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue;
}

// === DATE 18 ===
console.log('--- DATE 18 ---');
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const td18 = getByXPath(xpath18);
const button18 = td18.querySelector('button');

console.log('Button:', button18);
console.log('Text:', button18.textContent.trim());
console.log('Disabled attr:', button18.hasAttribute('disabled'));
console.log('Disabled prop:', button18.disabled);
console.log('ClassName:', button18.className);
console.log('Has "outside":', button18.className.includes('outside'));
console.log('Has "disabled":', button18.className.includes('disabled'));

console.log('\n--- Generate DSL for Date 18 ---');
const dsl18 = window.domDsl.generateDsl(button18);
console.log('DSL:', dsl18);

console.log('\n--- Generate Selector for Date 18 ---');
const cssGen = new window.domDsl.CssGenerator();
const sel18 = cssGen.buildSelector(dsl18, { ensureUnique: true, root: document });
console.log('Selector:', sel18.selector);
console.log('Is Unique:', sel18.isUnique);
console.log('Used nth-of-type:', sel18.usedNthOfType);

console.log('\n--- Test Selector for Date 18 ---');
const matches18 = document.querySelectorAll(sel18.selector);
console.log('Matches:', matches18.length);
if (matches18.length > 0) {
  console.log('First match:', matches18[0]);
  console.log('Text:', matches18[0].textContent.trim());
  console.log('Same element:', matches18[0] === button18);

  // Check position
  const td = matches18[0].closest('td');
  const tr = td.closest('tr');
  const tbody = tr.closest('tbody');
  const rowIdx = Array.from(tbody.children).indexOf(tr);
  const cellIdx = Array.from(tr.children).indexOf(td);
  console.log('Position: Row', rowIdx + 1, 'Cell', cellIdx + 1);
}

console.log('\n' + '='.repeat(70) + '\n');

// === DATE 31 ===
console.log('--- DATE 31 ---');
const xpath31 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[5]/td[7]';
const td31 = getByXPath(xpath31);
const button31 = td31.querySelector('button');

console.log('Button:', button31);
console.log('Text:', button31.textContent.trim());
console.log('Disabled:', button31.disabled);
console.log('ClassName:', button31.className);

// Check both buttons with text "31"
const allButtons = Array.from(document.querySelectorAll('button[role="gridcell"]'));
const buttons31 = allButtons.filter((btn) => btn.textContent.trim() === '31');

console.log('\n--- All buttons with text "31" ---');
buttons31.forEach((btn, idx) => {
  const td = btn.closest('td');
  const tr = td.closest('tr');
  const tbody = tr.closest('tbody');
  const rowIdx = Array.from(tbody.children).indexOf(tr);
  const cellIdx = Array.from(tr.children).indexOf(td);

  console.log(`\n[${idx}] Button at Row ${rowIdx + 1}, Cell ${cellIdx + 1}`);
  console.log('  Same as XPath button:', btn === button31);
  console.log('  Disabled:', btn.disabled);
  console.log('  Class includes "outside":', btn.className.includes('outside'));
  console.log('  Class includes "disabled":', btn.className.includes('disabled'));
  console.log('  aria-disabled:', btn.getAttribute('aria-disabled'));
});

console.log('\n--- Generate DSL for Date 31 (Row 5, Cell 7) ---');
const dsl31 = window.domDsl.generateDsl(button31);
console.log('DSL:', dsl31);

console.log('\n--- Generate Selector for Date 31 ---');
const sel31 = cssGen.buildSelector(dsl31, { ensureUnique: true, root: document });
console.log('Selector:', sel31.selector);
console.log('Is Unique:', sel31.isUnique);

console.log('\n--- Test Selector for Date 31 ---');
const matches31 = document.querySelectorAll(sel31.selector);
console.log('Matches:', matches31.length);
if (matches31.length > 0) {
  console.log('First match:', matches31[0]);
  console.log('Text:', matches31[0].textContent.trim());
  console.log('Same element:', matches31[0] === button31);

  const td = matches31[0].closest('td');
  const tr = td.closest('tr');
  const tbody = tr.closest('tbody');
  const rowIdx = Array.from(tbody.children).indexOf(tr);
  const cellIdx = Array.from(tr.children).indexOf(td);
  console.log('Position: Row', rowIdx + 1, 'Cell', cellIdx + 1);
}

console.log('\n' + '='.repeat(70));

// === SUMMARY ===
console.log('\n=== SUMMARY ===');
console.log('\nDate 18:');
console.log('  XPath element: Row 4, Cell 1');
console.log('  Selector:', sel18.selector);
console.log('  Matches:', matches18.length);
console.log('  Correct:', matches18.length === 1 && matches18[0] === button18 ? '✅' : '❌');

console.log('\nDate 31:');
console.log('  XPath element: Row 5, Cell 7');
console.log('  Selector:', sel31.selector);
console.log('  Matches:', matches31.length);
console.log('  Correct:', matches31.length === 1 && matches31[0] === button31 ? '✅' : '❌');

console.log('\n' + '='.repeat(70));
```

## Что проверяет этот скрипт

1. **Берет элементы напрямую через XPath** (гарантированно правильные)
2. **Генерирует DSL** для этих элементов
3. **Создает CSS селекторы**
4. **Проверяет что селекторы находят те же элементы**
5. **Показывает использует ли селектор :nth-child()**

## Ожидаемый результат

Если исправления работают правильно:

```
Date 18:
  XPath element: Row 4, Cell 1
  Selector: table > tbody.rdp-tbody > tr:nth-child(4) > td:nth-child(1) > button
  Matches: 1
  Correct: ✅

Date 31:
  XPath element: Row 5, Cell 7
  Selector: table > tbody.rdp-tbody > tr:nth-child(5) > td:nth-child(7) > button
  Matches: 1
  Correct: ✅
```

Если селекторы используют `:nth-of-type()` вместо `:nth-child()`, это укажет на проблему в коде.

## Запуск

Скопируйте весь скрипт и выполните в консоли браузера.
