# Быстрая инструкция по тестированию

## Текущий статус

✅ Браузер открыт на <https://appsurify.github.io/modern-seaside-stay/>
✅ Date picker открыт (видны даты 18 и 31)
✅ Библиотека `window.domDsl` загружена

## Что нужно сделать

1. **Откройте консоль браузера** (F12 или Cmd+Option+I)

2. **Вставьте и выполните быстрый тест:**

```javascript
// Быстрый тест для дат 18 и 31
['18', '31'].forEach((date) => {
  const cell = Array.from(document.querySelectorAll('.rdp-day')).find(
    (el) => el.textContent.trim() === date
  );

  if (!cell) {
    console.error(`❌ Date ${date} not found`);
    return;
  }

  const dsl = window.domDsl.generateDsl(cell);
  const cssGen = new window.domDsl.CssGenerator();
  const sel = cssGen.buildSelector(dsl, { ensureUnique: true });
  const matches = document.querySelectorAll(sel.selector);

  const pass = matches.length === 1 && matches[0] === cell;
  const usesNthChild = sel.selector.includes(':nth-child(');

  console.log(`\nDate ${date}:`, pass ? '✅ PASS' : '❌ FAIL');
  console.log(`  Selector: ${sel.selector}`);
  console.log(`  Matches: ${matches.length}`);
  console.log(`  Uses :nth-child(): ${usesNthChild ? '✅' : '❌'}`);
});
```

## Ожидаемый результат

```
Date 18: ✅ PASS
  Selector: table > tbody.rdp-tbody > tr:nth-child(3) > td:nth-child(5)
  Matches: 1
  Uses :nth-child(): ✅

Date 31: ✅ PASS
  Selector: table > tbody.rdp-tbody > tr:nth-child(5) > td:nth-child(6)
  Matches: 1
  Uses :nth-child(): ✅
```

## Критерии успеха

- ✅ Оба теста показывают PASS
- ✅ Каждый селектор находит ровно 1 элемент
- ✅ Селекторы используют `:nth-child()` (не `:nth-of-type()`)

## Если нужна детальная проверка

См. файл `MANUAL_TEST_COMMANDS.md` для полных команд с подробным выводом.

---

## Альтернатива: Использование $0 в консоли

Если вы предпочитаете тестировать через Elements panel:

1. Откройте Elements panel (F12)
2. Найдите кнопку с датой 18 в дереве элементов
3. Кликните на неё (она станет $0 в консоли)
4. В консоли выполните:

```javascript
const dsl = window.domDsl.generateDsl($0);
console.log({ dsl });
const result = window.domDsl.resolveDsl(dsl, document);
console.log({ result });
const cssGen = new window.domDsl.CssGenerator();
const sel = cssGen.buildSelector(dsl, { ensureUnique: true });
console.log({ sel });
console.log(sel.selector);
document.querySelectorAll(sel.selector);
```

Повторите для даты 31.

---

**Время выполнения:** ~2 минуты
**Последнее обновление:** 2026-01-16
