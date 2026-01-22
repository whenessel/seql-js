# Анализ корневой причины - Неправильные nth-child индексы

## Проблема

DSL генератор строит path с **неправильными nth-child индексами**.

### Пример для даты 18

**Входной элемент:**

- XPath: `/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]`
- Реальная позиция: **Row 4, Cell 1**
- Текст: **"18"**

**Сгенерированный селектор:**

```css
table > tbody > tr:nth-child(1) > td:nth-child(5) > button
                          ↑                 ↑
                        Row 1             Cell 5
```

**Что находит:**

- Row 1, Cell 5 → дату **"1"** ❌

**Что должно быть:**

```css
table > tbody > tr:nth-child(4) > td:nth-child(1) > button
                          ↑                 ↑
                        Row 4             Cell 1
```

## Гипотезы

### Гипотеза 1: PathBuilder фильтрует строки таблицы

Возможно `PathBuilder.filterNoise()` или другая логика **пропускает** некоторые TR элементы из path, считая их "шумом".

Код в `packages/dom-dsl/src/generator/path-builder.ts`:

```typescript
filterNoise(elements: Element[]): Element[] {
  return elements.filter(el => this.shouldInclude(el));
}

shouldInclude(element: Element): boolean {
  const tag = element.tagName.toLowerCase();

  // SEMANTIC_TAGS includes tr, td, th, tbody, etc
  if (SEMANTIC_TAGS.includes(tag)) return true;

  // But might have additional logic that filters them out
  if (tag === 'div' || tag === 'span') {
    return this.hasSemanticFeatures(element);
  }

  return false;
}
```

**Проблема:** Если TR или TD элементы не включаются в path, nth-child будет считаться неправильно.

### Гипотеза 2: Неправильный расчет nth-child индекса

В `CssGenerator.getNthSelector()`:

```typescript
private getNthSelector(element: Element, tag: string): string {
  const parent = element.parentElement;
  if (!parent) return '';

  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(element) + 1;

  // For table elements use nth-child
  if (['tr', 'td', 'th', 'thead', 'tbody', 'tfoot'].includes(tag)) {
    return `:nth-child(${index})`;
  }

  // For other elements use nth-of-type
  const typeIndex = siblings
    .filter(sib => sib.tagName.toLowerCase() === tag)
    .indexOf(element) + 1;

  return `:nth-of-type(${typeIndex})`;
}
```

**Вопрос:** Вызывается ли этот метод с правильным element?

### Гипотеза 3: Path содержит не те элементы

DSL может содержать path с неправильными элементами или в неправильном порядке.

## Диагностический скрипт

```javascript
console.clear();
console.log('=== PATH ANALYSIS ===\n');

function getByXPath(xpath) {
  return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    .singleNodeValue;
}

// Get button for date 18
const xpath18 = '/html/body/div[3]/div/div/div/div/table/tbody/tr[4]/td[1]';
const td18 = getByXPath(xpath18);
const button18 = td18.querySelector('button');

console.log('--- Button 18 ---');
console.log('Element:', button18);
console.log('Text:', button18.textContent.trim());

// Check actual path from button to table
console.log('\n--- Actual DOM Path (button → table) ---');
let el = button18;
let depth = 0;
while (el && el.tagName !== 'TABLE' && depth < 20) {
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;

  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(el);
    const nthChild = index + 1;

    console.log(
      `${depth}: ${tag}:nth-child(${nthChild}) of ${siblings.length} siblings (parent: ${parent.tagName})`
    );
  }

  el = parent;
  depth++;
}

// Generate DSL
console.log('\n--- Generated DSL ---');
const dsl18 = window.domDsl.generateDsl(button18);
console.log('DSL:', dsl18);

console.log('\n--- DSL Structure ---');
console.log('Anchor:', dsl18.anchor.tag, dsl18.anchor.semantics);
console.log('Path length:', dsl18.path.length);
dsl18.path.forEach((node, idx) => {
  console.log(`  Path[${idx}]:`, node.tag, node.semantics);
});
console.log('Target:', dsl18.target.tag, dsl18.target.semantics);

// Generate selector
console.log('\n--- Generated Selector ---');
const cssGen = new window.domDsl.CssGenerator();
const sel18 = cssGen.buildSelector(dsl18, { ensureUnique: true, root: document });
console.log('Selector:', sel18.selector);

// Parse selector to see nth-child values
console.log('\n--- Selector Analysis ---');
const nthChildMatches = sel18.selector.match(/:nth-child\((\d+)\)/g);
if (nthChildMatches) {
  console.log('nth-child selectors found:', nthChildMatches);
} else {
  console.log('No nth-child selectors found');
}

// Manual reconstruction of correct selector
console.log('\n--- Expected Selector ---');
console.log('table > tbody > tr:nth-child(4) > td:nth-child(1) > button');

console.log('\n--- Comparison ---');
console.log('Generated:', sel18.selector);
console.log('Expected:  table > tbody > tr:nth-child(4) > td:nth-child(1) > button');

// Test if generated selector is correct
const matches = document.querySelectorAll(sel18.selector);
console.log('\n--- Test Result ---');
console.log('Matches:', matches.length);
if (matches.length > 0) {
  console.log('Found text:', matches[0].textContent.trim());
  console.log('Expected text:', button18.textContent.trim());
  console.log('Match:', matches[0] === button18 ? '✅' : '❌');
}

console.log('\n' + '='.repeat(70));
```

## Что нужно проверить в коде

### 1. PathBuilder.buildPath() (packages/dom-dsl/src/generator/path-builder.ts)

Проверить:

- Включаются ли все TR и TD элементы в path?
- Правильно ли строится путь от anchor до target?
- Не фильтруются ли табличные элементы как "noise"?

### 2. CssGenerator.buildSelector() (packages/dom-dsl/src/resolver/css-generator.ts)

Проверить:

- Вызывается ли `getNthSelector()` для каждого элемента в path?
- Передается ли правильный element в `getNthSelector()`?
- Используется ли правильный parent для расчета nth-child?

### 3. CssGenerator.ensureUniqueSelector() (packages/dom-dsl/src/resolver/css-generator.ts)

Проверить:

- Не перезаписываются ли nth-child индексы на неправильные?
- Правильно ли работает `buildFullDomPathSelector()`?

## Ожидаемое поведение

Для button в Row 4, Cell 1:

1. **PathBuilder должен создать:**

```javascript
{
  anchor: { tag: 'table', ... },
  path: [
    { tag: 'tbody', ... },
    { tag: 'tr', ... },     // Row 4
    { tag: 'td', ... }      // Cell 1
  ],
  target: { tag: 'button', ... }
}
```

1. **CssGenerator должен создать:**

```css
table > tbody > tr:nth-child(4) > td:nth-child(1) > button
```

1. **Селектор должен найти:** ровно тот же button

## Следующие шаги

1. ✅ Выполнить диагностический скрипт выше
2. 📊 Посмотреть что содержится в `dsl18.path`
3. 🔍 Найти где теряется информация о правильной позиции
4. 🛠️ Исправить код
