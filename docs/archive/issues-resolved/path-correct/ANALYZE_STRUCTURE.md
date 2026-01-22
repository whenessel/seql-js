# Анализ структуры календаря

## Проблема

По accessibility tree видно что структура плоская - все ячейки идут подряд без явного разделения на строки. Но XPath указывает на структуру с `<tr>` элементами.

## Hypothesis

Возможно структура такая:

- `<table>` или `<div role="grid">`
  - `<tbody>` или просто контейнер
    - `<tr>` или `<div>` (строки)
      - `<td>` или `<div role="presentation">` (ячейки)
        - `<button role="gridcell">` (кнопка с датой)

XPath: `/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]`

- Указывает на `<td>` элемент (строка 4, ячейка 1)
- Но `.rdp-day` находит `<button>` внутри `<td>`

## Скрипт для проверки структуры

```javascript
console.clear();
console.log('=== Calendar Structure Analysis ===\n');

// Get element by XPath
function getByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue;
}

// Analyze Date 18
console.log('--- Date 18 Analysis ---');
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const td18 = getByXPath(xpath18);

console.log('1. XPath element (TD):');
console.log('   Element:', td18);
console.log('   Tag:', td18?.tagName);
console.log('   Role:', td18?.getAttribute('role'));
console.log('   Text content:', td18?.textContent.trim());
console.log('   Children count:', td18?.children.length);

// Check what's inside
if (td18) {
  console.log('\n2. Children of TD:');
  Array.from(td18.children).forEach((child, idx) => {
    console.log(
      `   [${idx}] ${child.tagName} class="${child.className}" text="${child.textContent.trim()}"`
    );
  });

  // Find button inside
  const button18 = td18.querySelector('button');
  console.log('\n3. Button inside TD:');
  console.log('   Button:', button18);
  console.log('   Button.textContent:', button18?.textContent.trim());
  console.log('   Button.className:', button18?.className);
  console.log('   Button.role:', button18?.getAttribute('role'));

  // Find by .rdp-day class
  const allRdpDays = Array.from(document.querySelectorAll('.rdp-day'));
  console.log('\n4. All .rdp-day elements:', allRdpDays.length);

  const foundByText = allRdpDays.find((el) => el.textContent.trim() === '18');
  console.log('\n5. Found by text "18" in .rdp-day:');
  console.log('   Element:', foundByText);
  console.log('   Same as button in TD:', foundByText === button18);

  // Check parent
  console.log('\n6. Parent of button:');
  console.log('   Parent:', foundByText?.parentElement);
  console.log('   Parent.tagName:', foundByText?.parentElement?.tagName);
  console.log('   Parent same as XPath TD:', foundByText?.parentElement === td18);

  // Get table structure
  const tbody = td18.closest('tbody');
  const tr = td18.closest('tr');
  const table = td18.closest('table');

  console.log('\n7. Table structure:');
  console.log('   Table:', table);
  console.log('   TBody:', tbody);
  console.log('   TBody class:', tbody?.className);
  console.log('   TR:', tr);
  console.log('   TR index in tbody:', Array.from(tbody.querySelectorAll('tr')).indexOf(tr));

  // Count rows and cells
  const allRows = Array.from(tbody.querySelectorAll('tr'));
  console.log('\n8. Rows analysis:');
  console.log('   Total rows:', allRows.length);
  allRows.forEach((row, idx) => {
    const cells = Array.from(row.children);
    console.log(
      `   Row ${idx + 1}: ${cells.length} cells, first cell text: "${cells[0]?.textContent.trim()}"`
    );
  });

  // Get current cell position
  const currentRow = td18.parentElement;
  const rowIndex = Array.from(tbody.children).indexOf(currentRow);
  const cellIndex = Array.from(currentRow.children).indexOf(td18);

  console.log('\n9. Position of XPath element:');
  console.log('   Row index (0-based):', rowIndex);
  console.log('   Cell index (0-based):', cellIndex);
  console.log('   Row index (1-based):', rowIndex + 1);
  console.log('   Cell index (1-based):', cellIndex + 1);
  console.log('   XPath says: tr[4]/td[1] (1-based)');
  console.log('   Match:', rowIndex + 1 === 4 && cellIndex + 1 === 1 ? '✅' : '❌');
}

console.log('\n' + '='.repeat(70) + '\n');

// Analyze Date 31
console.log('--- Date 31 Analysis ---');
const xpath31 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[5]/td[7]';
const td31 = getByXPath(xpath31);

console.log('1. XPath element (TD):');
console.log('   Element:', td31);
console.log('   Tag:', td31?.tagName);
console.log('   Text content:', td31?.textContent.trim());

if (td31) {
  const button31 = td31.querySelector('button');
  console.log('\n2. Button inside TD:');
  console.log('   Button.textContent:', button31?.textContent.trim());

  // Check position
  const currentRow31 = td31.parentElement;
  const tbody31 = td31.closest('tbody');
  const rowIndex31 = Array.from(tbody31.children).indexOf(currentRow31);
  const cellIndex31 = Array.from(currentRow31.children).indexOf(td31);

  console.log('\n3. Position:');
  console.log('   Row index (1-based):', rowIndex31 + 1);
  console.log('   Cell index (1-based):', cellIndex31 + 1);
  console.log('   XPath says: tr[5]/td[7]');
  console.log('   Match:', rowIndex31 + 1 === 5 && cellIndex31 + 1 === 7 ? '✅' : '❌');

  // Find by text
  const allRdpDays31 = Array.from(document.querySelectorAll('.rdp-day'));
  const foundByText31 = allRdpDays31.find((el) => el.textContent.trim() === '31');

  console.log('\n4. Found by text "31":');
  console.log('   Same as button in TD:', foundByText31 === button31);

  if (foundByText31 !== button31) {
    console.log('\n⚠️  DIFFERENT ELEMENTS!');
    console.log('   Found by text is:', foundByText31);
    console.log('   Its parent:', foundByText31?.parentElement);

    const parentTd31 = foundByText31.parentElement;
    const parentRow31 = parentTd31?.parentElement;
    const parentTbody31 = parentTd31?.closest('tbody');
    const foundRowIdx = Array.from(parentTbody31?.children || []).indexOf(parentRow31);
    const foundCellIdx = Array.from(parentRow31?.children || []).indexOf(parentTd31);

    console.log('   Position of found element:');
    console.log('     Row:', foundRowIdx + 1, 'Cell:', foundCellIdx + 1);
  }
}

console.log('\n' + '='.repeat(70));
```

## Ключевые вопросы для проверки

1. **Есть ли несколько элементов с текстом "18" или "31"?**
   - Возможно серые даты из других месяцев

2. **Правильно ли querySelector('.rdp-day') находит элемент?**
   - Может быть несколько кнопок с классом .rdp-day

3. **Соответствует ли найденный элемент XPath элементу?**
   - XPath → TD элемент строка 4, ячейка 1
   - querySelector → Button внутри TD?

4. **Какую структуру видит DSL генератор?**
   - Видит ли он TR элементы?
   - Правильно ли считает индексы?

## Ожидаемый результат

Скрипт должен показать:

- ✅ XPath находит правильный TD элемент
- ✅ Внутри TD есть button с нужным текстом
- ❌ Но querySelector('.rdp-day') находит другой элемент!

Это объяснит почему селектор "работает" (находит 1 элемент), но это неправильный элемент.
