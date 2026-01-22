# Команды для ручного тестирования в консоли браузера

## Статус

✅ Сайт открыт: <https://appsurify.github.io/modern-seaside-stay/>
✅ Date picker открыт (January 2026)
✅ Библиотека domDsl загружена в `window.domDsl`

## Команды для выполнения в консоли

### Тест 1: Дата 18

Скопируйте и вставьте этот код в консоль браузера:

```javascript
// === TEST 1: Date 18 ===
console.log('\n=== TEST 1: Date 18 ===\n');

// Найти ячейку с датой 18
const cells18 = Array.from(document.querySelectorAll('.rdp-day'));
const cell18 = cells18.find((el) => el.textContent.trim() === '18');

if (!cell18) {
  console.error('❌ Cell 18 not found');
} else {
  console.log('✅ Found cell 18:', cell18);
  console.log('   Tag:', cell18.tagName);
  console.log('   Class:', cell18.className);

  // Генерация DSL
  const dsl18 = window.domDsl.generateDsl(cell18);
  console.log('\n📝 DSL Generated:');
  console.log('   Anchor:', dsl18.anchor.tag);
  console.log('   Path length:', dsl18.path.length);
  console.log('   Target:', dsl18.target.tag);
  console.log('   Full DSL:', JSON.stringify(dsl18, null, 2));

  // Генерация CSS селектора
  const cssGen = new window.domDsl.CssGenerator();
  const sel18 = cssGen.buildSelector(dsl18, { ensureUnique: true, root: document });

  console.log('\n🎯 CSS Selector Generated:');
  console.log('   Selector:', sel18.selector);
  console.log('   Is Unique:', sel18.isUnique);
  console.log('   Used nth-of-type:', sel18.usedNthOfType);
  console.log('   Extra classes added:', sel18.extraClassesAdded);

  // Проверка селектора
  const matches18 = document.querySelectorAll(sel18.selector);
  console.log('\n🔍 Selector Test:');
  console.log('   Elements found:', matches18.length);

  if (matches18.length === 1 && matches18[0] === cell18) {
    console.log('   ✅ PASS: Selector is unique and matches correct element');
    console.log('   Matched element text:', matches18[0].textContent.trim());
  } else if (matches18.length > 1) {
    console.error('   ❌ FAIL: Selector is not unique!');
    console.log('   Found elements:');
    matches18.forEach((el, idx) => {
      console.log(`     [${idx}]`, el.textContent.trim());
    });
  } else if (matches18.length === 0) {
    console.error('   ❌ FAIL: Selector found no elements');
  } else {
    console.error('   ❌ FAIL: Selector matched wrong element');
    console.log('   Expected:', cell18.textContent.trim());
    console.log('   Got:', matches18[0].textContent.trim());
  }

  // Проверка что используется nth-child для таблиц
  if (sel18.selector.includes(':nth-child(')) {
    console.log('\n✅ CORRECT: Selector uses :nth-child() for table elements');
  } else if (sel18.selector.includes(':nth-of-type(')) {
    console.warn(
      '\n⚠️  WARNING: Selector uses :nth-of-type() - this might not be unique for tables!'
    );
  }

  // Резолв DSL обратно
  console.log('\n🔄 Resolving DSL back to element:');
  const result18 = window.domDsl.resolveDsl(dsl18, document);
  console.log('   Status:', result18.status);
  console.log('   Elements found:', result18.elements.length);
  console.log('   Confidence:', result18.confidence);

  if (result18.elements.length === 1 && result18.elements[0] === cell18) {
    console.log('   ✅ PASS: DSL resolves to correct element');
  } else {
    console.error('   ❌ FAIL: DSL resolution incorrect');
  }
}

console.log('\n' + '='.repeat(60) + '\n');
```

### Тест 2: Дата 31

После выполнения первого теста, скопируйте и вставьте:

```javascript
// === TEST 2: Date 31 ===
console.log('\n=== TEST 2: Date 31 ===\n');

// Найти ячейку с датой 31
const cells31 = Array.from(document.querySelectorAll('.rdp-day'));
const cell31 = cells31.find((el) => el.textContent.trim() === '31');

if (!cell31) {
  console.error('❌ Cell 31 not found');
} else {
  console.log('✅ Found cell 31:', cell31);
  console.log('   Tag:', cell31.tagName);
  console.log('   Class:', cell31.className);

  // Генерация DSL
  const dsl31 = window.domDsl.generateDsl(cell31);
  console.log('\n📝 DSL Generated:');
  console.log('   Anchor:', dsl31.anchor.tag);
  console.log('   Path length:', dsl31.path.length);
  console.log('   Target:', dsl31.target.tag);
  console.log('   Full DSL:', JSON.stringify(dsl31, null, 2));

  // Генерация CSS селектора
  const cssGen = new window.domDsl.CssGenerator();
  const sel31 = cssGen.buildSelector(dsl31, { ensureUnique: true, root: document });

  console.log('\n🎯 CSS Selector Generated:');
  console.log('   Selector:', sel31.selector);
  console.log('   Is Unique:', sel31.isUnique);
  console.log('   Used nth-of-type:', sel31.usedNthOfType);
  console.log('   Extra classes added:', sel31.extraClassesAdded);

  // Проверка селектора
  const matches31 = document.querySelectorAll(sel31.selector);
  console.log('\n🔍 Selector Test:');
  console.log('   Elements found:', matches31.length);

  if (matches31.length === 1 && matches31[0] === cell31) {
    console.log('   ✅ PASS: Selector is unique and matches correct element');
    console.log('   Matched element text:', matches31[0].textContent.trim());
  } else if (matches31.length > 1) {
    console.error('   ❌ FAIL: Selector is not unique!');
    console.log('   Found elements:');
    matches31.forEach((el, idx) => {
      console.log(`     [${idx}]`, el.textContent.trim());
    });
  } else if (matches31.length === 0) {
    console.error('   ❌ FAIL: Selector found no elements');
  } else {
    console.error('   ❌ FAIL: Selector matched wrong element');
    console.log('   Expected:', cell31.textContent.trim());
    console.log('   Got:', matches31[0].textContent.trim());
  }

  // Проверка что используется nth-child для таблиц
  if (sel31.selector.includes(':nth-child(')) {
    console.log('\n✅ CORRECT: Selector uses :nth-child() for table elements');
  } else if (sel31.selector.includes(':nth-of-type(')) {
    console.warn(
      '\n⚠️  WARNING: Selector uses :nth-of-type() - this might not be unique for tables!'
    );
  }

  // Резолв DSL обратно
  console.log('\n🔄 Resolving DSL back to element:');
  const result31 = window.domDsl.resolveDsl(dsl31, document);
  console.log('   Status:', result31.status);
  console.log('   Elements found:', result31.elements.length);
  console.log('   Confidence:', result31.confidence);

  if (result31.elements.length === 1 && result31.elements[0] === cell31) {
    console.log('   ✅ PASS: DSL resolves to correct element');
  } else {
    console.error('   ❌ FAIL: DSL resolution incorrect');
  }
}

console.log('\n' + '='.repeat(60) + '\n');
```

### Финальный отчет

После выполнения обоих тестов, выполните:

```javascript
// === FINAL REPORT ===
console.log('\n' + '='.repeat(60));
console.log('                    FINAL REPORT');
console.log('='.repeat(60) + '\n');

console.log('Test Summary:');
console.log('  Date 18: Check console output above');
console.log('  Date 31: Check console output above');
console.log('\n✅ Tests PASS if:');
console.log('  - Each selector finds exactly 1 element');
console.log('  - Selector uses :nth-child() for table elements');
console.log('  - Matched element is the correct cell');
console.log('  - DSL resolution returns the same element');
console.log('\n' + '='.repeat(60) + '\n');
```

## Ожидаемые результаты

### Для каждого теста вы должны увидеть

1. ✅ Found cell [18/31]
2. 📝 DSL Generated (with anchor, path, target)
3. 🎯 CSS Selector Generated
   - `isUnique: true`
   - Selector содержит `:nth-child()` для table elements
4. 🔍 Selector Test
   - `Elements found: 1`
   - ✅ PASS: Selector is unique and matches correct element
5. ✅ CORRECT: Selector uses :nth-child() for table elements
6. 🔄 Resolving DSL
   - `Status: success`
   - `Elements found: 1`
   - ✅ PASS: DSL resolves to correct element

### Признаки успеха

- ✅ Селектор уникален (finds 1 element)
- ✅ Использует `:nth-child()` для табличных элементов
- ✅ Найденный элемент совпадает с ожидаемым
- ✅ DSL корректно резолвится обратно в элемент

### Признаки проблемы

- ❌ Селектор находит > 1 элемента (не уникален)
- ⚠️ Использует `:nth-of-type()` вместо `:nth-child()`
- ❌ Найденный элемент не совпадает
- ❌ DSL не резолвится корректно

## Краткая версия (минимальный тест)

Если нужен быстрый тест, выполните только это:

```javascript
// Quick test
['18', '31'].forEach((date) => {
  const cell = Array.from(document.querySelectorAll('.rdp-day')).find(
    (el) => el.textContent.trim() === date
  );
  const dsl = window.domDsl.generateDsl(cell);
  const cssGen = new window.domDsl.CssGenerator();
  const sel = cssGen.buildSelector(dsl, { ensureUnique: true });
  const matches = document.querySelectorAll(sel.selector);

  console.log(
    `Date ${date}:`,
    matches.length === 1 && matches[0] === cell ? '✅ PASS' : '❌ FAIL',
    `(${matches.length} matches, selector: ${sel.selector})`
  );
});
```

Это должно вывести:

```
Date 18: ✅ PASS (1 matches, selector: ...)
Date 31: ✅ PASS (1 matches, selector: ...)
```

---

**Дата создания:** 2026-01-16
**Сайт:** <https://appsurify.github.io/modern-seaside-stay/>
**Статус:** Готово к выполнению
