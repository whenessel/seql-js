# Проблема: SVG дочерние элементы не резолвятся

## 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА

**Симптом**: DSL для SVG дочерних элементов (rect, path, line и др.) создается корректно, но resolver возвращает только anchor с предупреждением "Target not found, returning anchor".

**Затронуты**: Все SVG дочерние элементы (rect, path, circle, line, polygon и т.д.)

---

## 🔍 АНАЛИЗ ПРОБЛЕМЫ

### Пример DSL

```json
{
  "anchor": { "tag": "footer", "semantics": { "classes": ["text-card-foreground"] } },
  "path": [
    { "tag": "div", "semantics": { "classes": ["container"] }, "nthChild": 1 },
    { "tag": "ul", "semantics": {}, "nthChild": 2 },
    { "tag": "li", "semantics": { "text": { "normalized": "info@maresereno.com" } }, "nthChild": 3 },
    { "tag": "svg", "semantics": { "classes": ["lucide-mail"], "svg": {...} }, "nthChild": 1 }
  ],
  "target": {
    "tag": "rect",
    "semantics": { "svg": { "shape": "rect", "geomHash": "7bf591b2" } },
    "nthChild": 1
  }
}
```

### Реальная DOM структура

```
footer
  └─ div.container (nth-child: 1 от footer)
       └─ div (nth-child: 1 от div.container)  ← ПРОПУЩЕН В DSL!
            └─ div (nth-child: 3 от div)       ← ПРОПУЩЕН В DSL!
                 └─ ul (nth-child: 2 от div)    ← nth-child относится к этому родителю!
                      └─ li (nth-child: 3 от ul)
                           └─ svg (nth-child: 1 от li)
                                └─ rect (nth-child: 1 от svg)
```

### Генерируемый CSS селектор (НЕВЕРНЫЙ)

```css
footer.text-card-foreground > div.container:nth-child(1) > ul:nth-child(2) > li:nth-child(3) > svg.lucide-mail:nth-child(1) > rect:nth-child(1)
```

**Результат**: 0 элементов ❌

**Почему не работает**:

- Селектор требует что `ul` является **прямым ребенком** `div.container` (из-за `>`)
- Селектор требует что `ul` является **2-м ребенком** `div.container` (из-за `:nth-child(2)`)
- Но в реальности `ul` находится на 3 уровня ниже, внутри промежуточных `div`
- `nth-child(2)` относится к промежуточному div, а не к div.container

---

## 🐛 КОРНЕВАЯ ПРИЧИНА

### Проблема в CssGenerator.buildSelector()

**Файл**: `/src/resolver/css-generator.ts`  
**Строка**: ~147

```typescript
// Path nodes with nth-child
for (const node of dsl.path) {
  let nodeSelector = this.buildNodeSelector(node.tag, node.semantics);

  // ПРОБЛЕМА: nth-child добавляется напрямую из DSL
  if (node.nthChild !== undefined) {
    nodeSelector += `:nth-child(${node.nthChild})`;
  }

  parts.push(nodeSelector);
}

// ПРОБЛЕМА: Используется child combinator (>)
const baseSelector = parts.join(' > ');
```

### Почему это ломается

1. **DSL path содержит только "семантические" элементы**:
   - DslBuilder фильтрует "несемантические" div/span без классов/атрибутов
   - В path попадают только элементы с классами или другими признаками

2. **nthChild в DSL относится к РЕАЛЬНОМУ родителю**:
   - `ul: { nthChild: 2 }` означает "ul является 2-м ребенком своего родителя в DOM"
   - НЕ означает "ul является 2-м ребенком div.container из DSL path"

3. **Child combinator (>) требует точного соответствия**:
   - `A > B` означает "B является прямым ребенком A"
   - Промежуточные элементы не допускаются

4. **Комбинация child combinator + nth-child из DSL = неверный селектор**:

   ```
   div.container:nth-child(1) > ul:nth-child(2)
   ↑                             ↑
   div.container                 ul должен быть прямым ребенком div.container
   который является             И 2-м ребенком div.container
   1-м ребенком footer          ❌ НО ul находится на 3 уровня ниже!
   ```

---

## ✅ ПРОВЕРКА НА СТРАНИЦЕ

### Селекторы которые РАБОТАЮТ

```javascript
// ✅ Descendant combinator с nth-child (1 элемент)
'footer div.container:nth-child(1) ul:nth-child(2) li:nth-child(3) svg:nth-child(1) rect:nth-child(1)';

// ✅ Без nth-child вообще (1 элемент)
'footer div.container ul li svg.lucide-mail rect';

// ✅ Полный путь со всеми div (1 элемент)
'footer > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > ul:nth-child(2) > li:nth-child(3) > svg:nth-child(1) > rect:nth-child(1)';

// ✅ Гибридный: descendant для основного пути, child для SVG (1 элемент)
'footer div.container ul li > svg > rect';
```

### Селектор который НЕ РАБОТАЕТ

```javascript
// ❌ Child combinator с nth-child из DSL (0 элементов)
'footer > div.container:nth-child(1) > ul:nth-child(2) > li:nth-child(3) > svg:nth-child(1) > rect:nth-child(1)';
```

---

## 🔧 РЕШЕНИЯ

### Решение 1: Использовать descendant combinator по умолчанию

#### Простое и безопасное

```typescript
// В buildSelector()
// БЫЛО:
const baseSelector = parts.join(' > ');

// ДОЛЖНО БЫТЬ:
const baseSelector = parts.join(' ');
```

**Преимущества**:

- Работает с пропущенными промежуточными элементами
- nth-child из DSL продолжает работать (относительно реального родителя)
- Минимальные изменения кода

**Недостатки**:

- Менее точные селекторы (могут найти вложенные элементы)
- Медленнее производительность

---

### Решение 2: НЕ использовать nth-child при child combinator

#### Более корректное

```typescript
// В buildSelector()
const useChildCombinator = true; // Опция

for (const node of dsl.path) {
  let nodeSelector = this.buildNodeSelector(node.tag, node.semantics);

  // ИЗМЕНЕНО: НЕ добавляем nth-child при использовании child combinator
  if (!useChildCombinator && node.nthChild !== undefined) {
    nodeSelector += `:nth-child(${node.nthChild})`;
  }

  parts.push(nodeSelector);
}

const baseSelector = useChildCombinator
  ? parts.join(' > ') // Child combinator БЕЗ nth-child
  : parts.join(' '); // Descendant combinator С nth-child
```

**Преимущества**:

- Логически корректно
- Можно выбирать стратегию

**Недостатки**:

- Требует изменения логики
- Нужно решить когда использовать какой вариант

---

### Решение 3: Специальная обработка для SVG элементов

#### Целенаправленное

```typescript
// Специальная логика для SVG дочерних элементов
const isSvgChild = ['rect', 'path', 'circle', 'line', 'polygon', 'ellipse', 'polyline'].includes(
  dsl.target.tag
);

if (isSvgChild) {
  // Для SVG используем descendant до svg, потом child для svg > rect
  const svgIndex = dsl.path.findIndex((node) => node.tag === 'svg');

  if (svgIndex !== -1) {
    const beforeSvg = parts.slice(0, svgIndex + 1);
    const svgAndAfter = parts.slice(svgIndex + 1);

    // До SVG: descendant combinator
    // После SVG: child combinator
    const baseSelector = beforeSvg.join(' ') + ' > ' + svgAndAfter.join(' > ');
  }
}
```

**Преимущества**:

- Точное решение для SVG
- Сохраняет поведение для остальных элементов

**Недостатки**:

- Не решает общую проблему с nth-child

---

### Решение 4: Строить полный DOM путь (ЛУЧШЕЕ)

#### Наиболее корректное

Это уже реализовано в `buildPathFromAnchorToTarget()`, но НЕ используется в `buildSelector()`!

```typescript
// В buildSelector()
if (options?.ensureUnique) {
  // Используем buildFullDomPathSelector для точного пути
  const fullPathSelector = this.buildFullDomPathSelector(
    dsl,
    dsl.target.semantics,
    options.root ?? document
  );

  if (fullPathSelector && this.isUnique(fullPathSelector, options.root ?? document)) {
    return {
      selector: fullPathSelector,
      isUnique: true,
      usedNthOfType: fullPathSelector.includes(':nth-'),
      extraClassesAdded: 0,
    };
  }
}
```

**Преимущества**:

- Строит РЕАЛЬНЫЙ DOM путь со всеми элементами
- Использует nth-child корректно
- Уже реализовано и протестировано

**Недостатки**:

- Требует доступ к реальному DOM для построения
- Не работает без ensureUnique

---

## 🎯 РЕКОМЕНДУЕМОЕ РЕШЕНИЕ

### Комбинированный подход

1. **По умолчанию**: Использовать **descendant combinator** (пробел)
2. **С ensureUnique**: Использовать **buildFullDomPathSelector** для точного пути
3. **Для SVG дочерних элементов**: Специальная обработка с `svg > rect`

### Код изменений

```typescript
// В buildSelector()
buildSelector(dsl: DslIdentity, options?: BuildSelectorOptions): string | BuildSelectorResult {
  // ... existing code ...

  // Determine combinator strategy
  const isSvgChild = ['rect', 'path', 'circle', 'line', 'polygon', 'ellipse', 'polyline', 'g'].includes(dsl.target.tag);

  // Build base selector
  let baseSelector: string;

  if (isSvgChild && dsl.path.some(n => n.tag === 'svg')) {
    // Special handling for SVG children: use child combinator only for svg > rect
    const svgIndex = dsl.path.findIndex(n => n.tag === 'svg');
    const beforeSvg = parts.slice(0, svgIndex + 1);
    const afterSvg = parts.slice(svgIndex + 1);

    baseSelector = beforeSvg.join(' ') + ' > ' + afterSvg.concat(parts[parts.length - 1]).join(' > ');
  } else {
    // For regular elements: use descendant combinator (space)
    baseSelector = parts.join(' ');
  }

  // If uniqueness check not requested, return simple selector
  if (!options?.ensureUnique) {
    return baseSelector;
  }

  // For ensureUnique: try buildFullDomPathSelector first
  const fullPathSelector = this.buildFullDomPathSelector(dsl, dsl.target.semantics, options.root ?? document);

  if (fullPathSelector && this.isUnique(fullPathSelector, options.root ?? document)) {
    return {
      selector: fullPathSelector,
      isUnique: true,
      usedNthOfType: fullPathSelector.includes(':nth-'),
      extraClassesAdded: 0
    };
  }

  // Fallback to regular ensureUniqueSelector logic
  return this.ensureUniqueSelector(baseSelector, dsl, options);
}
```

---

## ✅ ТЕСТЫ

### Test 1: SVG rect element resolves correctly

```typescript
it('should resolve SVG rect element', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <footer class="text-card-foreground">
      <div class="container">
        <div>
          <div>
            <ul>
              <li>
                <svg class="lucide-mail">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <span>info@example.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  `;
  document.body.appendChild(div);

  const dsl: DslIdentity = {
    anchor: { tag: 'footer', semantics: { classes: ['text-card-foreground'] } },
    path: [
      { tag: 'div', semantics: { classes: ['container'] }, nthChild: 1 },
      { tag: 'ul', semantics: {}, nthChild: 1 },
      { tag: 'li', semantics: {}, nthChild: 1 },
      { tag: 'svg', semantics: { classes: ['lucide-mail'] }, nthChild: 1 },
    ],
    target: { tag: 'rect', semantics: {}, nthChild: 1 },
  };

  const result = generator.buildSelector(dsl, { ensureUnique: true, root: div });

  expect(result.isUnique).toBe(true);
  expect(result.selector).toMatch(/svg.*rect/);

  const matched = div.querySelectorAll(result.selector);
  expect(matched.length).toBe(1);
  expect(matched[0].tagName.toLowerCase()).toBe('rect');

  document.body.removeChild(div);
});
```

### Test 2: SVG path element resolves correctly

```typescript
it('should resolve SVG path element', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <footer>
      <svg class="icon">
        <rect x="0" y="0"></rect>
        <path d="M10 10 L20 20"></path>
      </svg>
    </footer>
  `;
  document.body.appendChild(div);

  const dsl: DslIdentity = {
    anchor: { tag: 'footer', semantics: {} },
    path: [{ tag: 'svg', semantics: { classes: ['icon'] }, nthChild: 1 }],
    target: { tag: 'path', semantics: {}, nthChild: 2 },
  };

  const result = generator.buildSelector(dsl, { ensureUnique: true, root: div });

  expect(result.isUnique).toBe(true);

  const matched = div.querySelector(result.selector);
  expect(matched?.tagName.toLowerCase()).toBe('path');

  document.body.removeChild(div);
});
```

### Test 3: Should use descendant combinator by default

```typescript
it('should use descendant combinator for paths with nth-child', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="container">
      <div>
        <div>
          <ul>
            <li class="item">Target</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);

  const dsl: DslIdentity = {
    anchor: { tag: 'div', semantics: { classes: ['container'] } },
    path: [{ tag: 'ul', semantics: {}, nthChild: 1 }],
    target: { tag: 'li', semantics: { classes: ['item'] }, nthChild: 1 },
  };

  const result = generator.buildSelector(dsl);

  // Should use space (descendant) not > (child)
  expect(result).toContain(' ');
  expect(result).not.toMatch(/>\s*ul/);

  const matched = div.querySelectorAll(result);
  expect(matched.length).toBe(1);

  document.body.removeChild(div);
});
```

---

## 📊 КРИТЕРИИ УСПЕХА

После применения исправлений:

1. ✅ SVG rect элементы резолвятся корректно
2. ✅ SVG path элементы резолвятся корректно
3. ✅ Селектор находит 1 элемент (не 0, не несколько)
4. ✅ Descendant combinator используется по умолчанию
5. ✅ Child combinator используется только для svg > rect
6. ✅ nth-child работает корректно с descendant combinator
7. ✅ Все существующие тесты продолжают работать

---

## 🔗 СВЯЗАННЫЕ ПРОБЛЕМЫ

Эта проблема также объясняет:

- Проблему #3 из предыдущего документа (div.inset-0 не различаются)
- Общую проблему с child combinator и nth-child

**Корень**: Неправильное использование nth-child из DSL при child combinator.
