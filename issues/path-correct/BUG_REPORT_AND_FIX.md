# Bug Report: Wrong Element Selection in buildFullDomPathSelector

## Summary

`CssGenerator.buildFullDomPathSelector()` выбирает **первый найденный элемент** вместо **правильного элемента** когда есть несколько элементов с одинаковым текстом.

## Location

**File:** `packages/dom-dsl/src/resolver/css-generator.ts`
**Method:** `buildFullDomPathSelector()`
**Line:** 267

```typescript
if (targetCandidates.length > 0) {
  // Build selector path from anchor to target
  const targetElement = targetCandidates[0];  // ← BUG: Always takes first!
  const pathSelector = this.buildPathFromAnchorToTarget(
    anchor,
    targetElement,
    dsl,
    root
  );
```

## Problem

Когда calendar содержит даты из разных месяцев (например, серые даты 28-31 декабря в строке 1, и даты января в остальных строках), метод `findTargetWithinAnchor()` находит ВСЕ кнопки с нужным текстом, но `buildFullDomPathSelector()` всегда выбирает первую.

### Example: Date 31

**Найденные элементы:**
- `targetCandidates[0]` = Button "31" в Row 1, Cell 4 (декабрь, серая) ← выбирается
- `targetCandidates[1]` = Button "31" в Row 5, Cell 7 (январь, активная) ← нужная!

**Result:**
- Генерируется селектор для неправильного элемента
- Селектор: `tr:nth-child(1) > td:nth-child(4)`
- Должен быть: `tr:nth-child(5) > td:nth-child(7)`

## Root Cause Analysis

### Why does this happen?

DSL содержит **описательную** информацию (tag, classes, attributes, text), но **не содержит позиционную** информацию (nth-child индексы).

При резолюции DSL обратно в selector:
1. ✅ Anchor находится правильно (table)
2. ❌ Target ищется только по тексту → находится первый с таким текстом
3. ❌ Path строится от anchor к неправильному target

### Why wasn't this caught earlier?

Тесты в `css-generator.test.ts` не покрывают случай когда **несколько элементов с одинаковым текстом** в разных позициях таблицы.

## Solution Options

### Option 1: Match candidates by path structure (Recommended) ⭐

Сравнить structure path каждого candidate с DSL path и выбрать наиболее подходящего.

```typescript
private buildFullDomPathSelector(
  dsl: DslIdentity,
  targetSemantics: DslSemantics,
  root: Document | Element
): string | null {
  const anchorSelector = this.buildNodeSelector(dsl.anchor.tag, dsl.anchor.semantics);
  const anchors = this.querySelectorSafe(anchorSelector, root);

  if (anchors.length === 0) return null;

  for (const anchor of anchors) {
    const targetCandidates = this.findTargetWithinAnchor(
      anchor,
      dsl.target.tag,
      targetSemantics
    );

    if (targetCandidates.length === 0) continue;

    // NEW: Score each candidate by how well its path matches DSL path
    const scoredCandidates = targetCandidates.map(candidate => {
      const score = this.scorePathMatch(candidate, anchor, dsl.path);
      return { element: candidate, score };
    });

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Try candidates in order of best match
    for (const { element } of scoredCandidates) {
      const pathSelector = this.buildPathFromAnchorToTarget(
        anchor,
        element,
        dsl,
        root
      );

      if (pathSelector && this.isUnique(pathSelector, root)) {
        return pathSelector;
      }
    }
  }

  return null;
}

/**
 * Scores how well a candidate's DOM path matches the DSL path
 */
private scorePathMatch(
  candidate: Element,
  anchor: Element,
  dslPath: PathNode[]
): number {
  // Build actual DOM path from anchor to candidate
  const domPath: Element[] = [];
  let el: Element | null = candidate.parentElement;

  while (el && el !== anchor) {
    domPath.unshift(el);
    el = el.parentElement;
  }

  let score = 0;
  const minLength = Math.min(domPath.length, dslPath.length);

  // Compare tags at each level
  for (let i = 0; i < minLength; i++) {
    const domEl = domPath[i];
    const dslNode = dslPath[i];

    // Match tag
    if (domEl.tagName.toLowerCase() === dslNode.tag) {
      score += 1;
    }

    // Match classes if present in DSL
    if (dslNode.semantics.classes) {
      const matchingClasses = dslNode.semantics.classes.filter(
        cls => domEl.classList.contains(cls)
      );
      score += matchingClasses.length * 0.5;
    }

    // Match attributes if present in DSL
    if (dslNode.semantics.attributes) {
      const matchingAttrs = Object.entries(dslNode.semantics.attributes).filter(
        ([name, value]) => domEl.getAttribute(name) === value
      );
      score += matchingAttrs.length * 0.5;
    }
  }

  // Penalty if path lengths don't match
  const lengthDiff = Math.abs(domPath.length - dslPath.length);
  score -= lengthDiff * 0.3;

  return score;
}
```

**Pros:**
- ✅ Работает с текущей структурой DSL
- ✅ Выбирает наиболее подходящий элемент
- ✅ Не ломает существующие тесты

**Cons:**
- Немного сложнее реализация

### Option 2: Store nth-child in DSL during generation

Изменить структуру DSL чтобы PathNode включал nth-child:

```typescript
// В types.ts
export interface PathNode {
  tag: string;
  semantics: DslSemantics;
  score: number;
  nthChild?: number;  // ← NEW
}
```

```typescript
// В generator/path-builder.ts
buildPath(anchor: Element, target: Element, extractor: SemanticExtractor) {
  const path = [];
  let el = target.parentElement;

  while (el && el !== anchor) {
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const nthChild = siblings.indexOf(el) + 1;

      path.unshift({
        tag: el.tagName.toLowerCase(),
        semantics: extractor.extract(el),
        score: extractor.scoreElement(el),
        nthChild  // ← NEW
      });
    }

    el = parent;
  }

  return { path };
}
```

**Pros:**
- ✅ Самое точное решение
- ✅ Селекторы всегда правильные

**Cons:**
- ❌ Изменяет структуру DSL (breaking change)
- ❌ Увеличивает размер DSL
- ❌ DSL становится менее portable (зависит от конкретной структуры DOM)

### Option 3: Improve findTargetWithinAnchor filtering

Добавить дополнительные критерии фильтрации чтобы исключить disabled/outside элементы:

```typescript
private findTargetWithinAnchor(
  anchor: Element,
  targetTag: string,
  targetSemantics: DslSemantics
): Element[] {
  const candidates = Array.from(anchor.querySelectorAll(targetTag));

  return candidates.filter(el => {
    // Existing text/class/attribute matching...

    // NEW: Exclude disabled/outside elements
    const button = el as HTMLButtonElement;
    if (button.disabled) return false;
    if (button.className.includes('outside')) return false;
    if (button.getAttribute('aria-disabled') === 'true') return false;

    return true;
  });
}
```

**Pros:**
- ✅ Простая реализация
- ✅ Помогает в календарях

**Cons:**
- ❌ Не решает общую проблему
- ❌ Специфично для date pickers
- ❌ Могут быть другие случаи дублирующихся элементов

## Recommended Solution

**Option 1** (Path matching score) - это наилучшее решение потому что:

1. Не ломает существующую структуру DSL
2. Работает для всех типов дублирующихся элементов (не только календари)
3. Выбирает наиболее подходящий элемент на основе полного совпадения структуры
4. Можно добавить без breaking changes

## Implementation Plan

1. Добавить метод `scorePathMatch()` в `CssGenerator`
2. Изменить `buildFullDomPathSelector()` чтобы использовать scoring
3. Добавить тесты для calendar table case
4. Запустить существующие тесты для проверки регрессий

## Tests Needed

```typescript
it('should handle duplicate text in different table rows', () => {
  const div = document.createElement('div');
  div.innerHTML = `
    <table>
      <tbody>
        <tr><td><button disabled class="outside">31</button></td><td><button>1</button></td></tr>
        <tr><td><button>28</button></td><td><button>29</button></td></tr>
        <tr><td><button>30</button></td><td><button>31</button></td></tr>
      </tbody>
    </table>
  `;
  document.body.appendChild(div);

  try {
    const targetButton = div.querySelectorAll('button')[5]; // Row 3, Cell 2, text "31"
    const dsl = generateDsl(targetButton);
    const cssGen = new CssGenerator();
    const result = cssGen.buildSelector(dsl, { ensureUnique: true, root: div });

    const matches = div.querySelectorAll(result.selector);
    expect(matches.length).toBe(1);
    expect(matches[0]).toBe(targetButton);
    expect(matches[0].textContent).toBe('31');
    expect(matches[0].hasAttribute('disabled')).toBe(false);
  } finally {
    document.body.removeChild(div);
  }
});
```

## Impact

- **Severity:** HIGH - селекторы находят неправильные элементы
- **Affected:** Календари, таблицы, списки с дублирующимися значениями
- **Users:** Любой кто использует DSL для элементов с повторяющимся текстом

---

**Status:** Ready for implementation
**Priority:** P0 (Critical)
**Estimated Effort:** 2-3 hours
