# Финальный тест с nthChild исправлением

## Что исправлено

✅ Добавлено поле `nthChild` в `PathNode` type
✅ `PathBuilder` теперь вычисляет и сохраняет nth-child позицию для каждого элемента в path
✅ `CssGenerator` использует nth-child из DSL для построения точных селекторов
✅ Пакет собран успешно

## Инструкции для тестирования

### Шаг 1: Обновить библиотеку в браузере

Библиотека уже была загружена в snippets браузера. Нужно **перезагрузить** UMD файл:

1. В DevTools откройте Sources → Snippets
2. Найдите snippet с dom-dsl
3. Удалите старое содержимое
4. Скопируйте новое содержимое из:
   `/Users/whenessel/Development/WebstormProjects/visual-coverage-rrweb/packages/dom-dsl/dist/dom-dsl.umd.min.cjs`
5. Запустите snippet (Cmd+Enter)

Или просто перезагрузите страницу и заново загрузите snippet.

### Шаг 2: Выполнить финальный тест

Скопируйте и выполните этот скрипт в консоли браузера:

```javascript
console.clear();
console.log('=== FINAL TEST WITH nthChild FIX ===\n');

// Helper
function getByXPath(xpath) {
  return document.evaluate(xpath, document, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

// === TEST DATE 18 ===
console.log('--- TEST DATE 18 ---');
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const td18 = getByXPath(xpath18);
const button18 = td18.querySelector('button');

console.log('✓ Element via XPath:');
console.log('  Text:', button18.textContent.trim());
console.log('  Expected position: Row 4, Cell 1');

// Get parent positions to verify
const tr18 = td18.closest('tr');
const tbody18 = tr18.closest('tbody');
const rowIdx18 = Array.from(tbody18.children).indexOf(tr18) + 1;
const cellIdx18 = Array.from(tr18.children).indexOf(td18) + 1;
console.log('  Actual position: Row', rowIdx18, 'Cell', cellIdx18);

// Generate DSL
console.log('\n✓ Generating DSL...');
const dsl18 = window.domDsl.generateDsl(button18);
console.log('  DSL generated');
console.log('  Path length:', dsl18.path.length);

// Check nthChild in path
console.log('\n✓ Checking nthChild in DSL path:');
dsl18.path.forEach((node, idx) => {
  console.log(`  Path[${idx}]: ${node.tag}, nthChild: ${node.nthChild || 'undefined'}`);
});

// Generate selector
console.log('\n✓ Generating CSS selector...');
const cssGen = new window.domDsl.CssGenerator();
const sel18 = cssGen.buildSelector(dsl18, { ensureUnique: true, root: document });

console.log('  Selector:', sel18.selector);
console.log('  Is unique:', sel18.isUnique);

// Extract nth-child values from selector
const nthChildMatches18 = sel18.selector.match(/:nth-child\((\d+)\)/g);
console.log('  nth-child in selector:', nthChildMatches18 || 'none');

// Test selector
console.log('\n✓ Testing selector...');
const matches18 = document.querySelectorAll(sel18.selector);
console.log('  Matches found:', matches18.length);

if (matches18.length > 0) {
  const matched = matches18[0];
  console.log('  Matched text:', matched.textContent.trim());
  console.log('  Expected text: 18');
  console.log('  Same element:', matched === button18);

  // Get matched position
  const tdMatched18 = matched.closest('td');
  const trMatched18 = tdMatched18.closest('tr');
  const tbodyMatched18 = trMatched18.closest('tbody');
  const matchedRowIdx = Array.from(tbodyMatched18.children).indexOf(trMatched18) + 1;
  const matchedCellIdx = Array.from(trMatched18.children).indexOf(tdMatched18) + 1;
  console.log('  Matched position: Row', matchedRowIdx, 'Cell', matchedCellIdx);

  if (matched === button18) {
    console.log('\n✅ TEST 18: PASS - Selector found correct element!');
  } else {
    console.error('\n❌ TEST 18: FAIL - Selector found wrong element');
  }
} else {
  console.error('\n❌ TEST 18: FAIL - Selector found no elements');
}

console.log('\n' + '='.repeat(70) + '\n');

// === TEST DATE 31 ===
console.log('--- TEST DATE 31 ---');
const xpath31 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[5]/td[7]';
const td31 = getByXPath(xpath31);
const button31 = td31.querySelector('button');

console.log('✓ Element via XPath:');
console.log('  Text:', button31.textContent.trim());
console.log('  Expected position: Row 5, Cell 7');

const tr31 = td31.closest('tr');
const tbody31 = tr31.closest('tbody');
const rowIdx31 = Array.from(tbody31.children).indexOf(tr31) + 1;
const cellIdx31 = Array.from(tr31.children).indexOf(td31) + 1;
console.log('  Actual position: Row', rowIdx31, 'Cell', cellIdx31);

// Generate DSL
console.log('\n✓ Generating DSL...');
const dsl31 = window.domDsl.generateDsl(button31);
console.log('  DSL generated');

console.log('\n✓ Checking nthChild in DSL path:');
dsl31.path.forEach((node, idx) => {
  console.log(`  Path[${idx}]: ${node.tag}, nthChild: ${node.nthChild || 'undefined'}`);
});

// Generate selector
console.log('\n✓ Generating CSS selector...');
const sel31 = cssGen.buildSelector(dsl31, { ensureUnique: true, root: document });

console.log('  Selector:', sel31.selector);
console.log('  Is unique:', sel31.isUnique);

const nthChildMatches31 = sel31.selector.match(/:nth-child\((\d+)\)/g);
console.log('  nth-child in selector:', nthChildMatches31 || 'none');

// Test selector
console.log('\n✓ Testing selector...');
const matches31 = document.querySelectorAll(sel31.selector);
console.log('  Matches found:', matches31.length);

if (matches31.length > 0) {
  const matched = matches31[0];
  console.log('  Matched text:', matched.textContent.trim());
  console.log('  Expected text: 31');
  console.log('  Same element:', matched === button31);

  const tdMatched31 = matched.closest('td');
  const trMatched31 = tdMatched31.closest('tr');
  const tbodyMatched31 = trMatched31.closest('tbody');
  const matchedRowIdx31 = Array.from(tbodyMatched31.children).indexOf(trMatched31) + 1;
  const matchedCellIdx31 = Array.from(trMatched31.children).indexOf(tdMatched31) + 1;
  console.log('  Matched position: Row', matchedRowIdx31, 'Cell', matchedCellIdx31);

  if (matched === button31) {
    console.log('\n✅ TEST 31: PASS - Selector found correct element!');
  } else {
    console.error('\n❌ TEST 31: FAIL - Selector found wrong element');
  }
} else {
  console.error('\n❌ TEST 31: FAIL - Selector found no elements');
}

console.log('\n' + '='.repeat(70));
console.log('\n=== FINAL SUMMARY ===\n');

const test18Pass = matches18.length === 1 && matches18[0] === button18;
const test31Pass = matches31.length === 1 && matches31[0] === button31;

console.log('Date 18:', test18Pass ? '✅ PASS' : '❌ FAIL');
console.log('Date 31:', test31Pass ? '✅ PASS' : '❌ FAIL');

if (test18Pass && test31Pass) {
  console.log('\n🎉 ALL TESTS PASSED! The nthChild fix works correctly!');
} else {
  console.error('\n⚠️  Some tests failed. Check the output above for details.');
}

console.log('\n' + '='.repeat(70));
```

## Ожидаемый результат

Если исправление работает правильно, вы должны увидеть:

```
--- TEST DATE 18 ---
✓ Element via XPath:
  Text: 18
  Expected position: Row 4, Cell 1
  Actual position: Row 4 Cell 1

✓ Checking nthChild in DSL path:
  Path[0]: tbody, nthChild: 2
  Path[1]: tr, nthChild: 4
  Path[2]: td, nthChild: 1

✓ Generating CSS selector...
  Selector: table[...] > tbody:nth-child(2) > tr:nth-child(4) > td:nth-child(1) > button[...]
  Is unique: true
  nth-child in selector: [':nth-child(2)', ':nth-child(4)', ':nth-child(1)']

✓ Testing selector...
  Matches found: 1
  Matched text: 18
  Expected text: 18
  Same element: true
  Matched position: Row 4 Cell 1

✅ TEST 18: PASS - Selector found correct element!

--- TEST DATE 31 ---
... (аналогично для Row 5, Cell 7) ...

✅ TEST 31: PASS - Selector found correct element!

=== FINAL SUMMARY ===
Date 18: ✅ PASS
Date 31: ✅ PASS

🎉 ALL TESTS PASSED! The nthChild fix works correctly!
```

## Что проверяет тест

1. ✅ `nthChild` присутствует в DSL path nodes
2. ✅ Селектор содержит правильные `:nth-child()` значения
3. ✅ Селектор находит ровно 1 элемент
4. ✅ Найденный элемент совпадает с исходным (XPath)
5. ✅ Позиция найденного элемента правильная (Row, Cell)

## Troubleshooting

Если тесты не проходят:

1. **Проверьте что библиотека обновлена:**
   ```javascript
   console.log(window.domDsl);
   ```

2. **Проверьте что nthChild есть в DSL:**
   ```javascript
   const dsl = window.domDsl.generateDsl(button18);
   console.log(dsl.path);
   ```

3. **Перезагрузите страницу** и заново загрузите обновленный snippet

---

**Дата:** 2026-01-16
**Статус:** Ready for testing
**Изменения:** Added nthChild to PathNode, PathBuilder calculates it, CssGenerator uses it
