# Migration from CSS/XPath

Guide for migrating from traditional selectors to SEQL.

## From CSS Selectors

### Brittle CSS

```css
/* ❌ Brittle: Breaks when structure changes */
.modal > div:nth-child(2) > button.primary
```

```typescript
// ✅ SEQL: Semantic, survives refactoring
import { generateSEQL } from 'seql-js';

const button = document.querySelector('.modal button.primary');
const selector = generateSEQL(button);
// "v1: div[role="dialog"] :: button[type="submit",text="Save"]"
```

### Class-Based Selectors

```css
/* ❌ Breaks when classes are renamed */
.submit-btn-primary
```

```typescript
// ✅ Uses semantic attributes
const button = document.querySelector('.submit-btn-primary');
generateSEQL(button);
// "v1: form :: button[type="submit",text="Submit"]"
```

## From XPath

### XPath Structure

```xpath
<!-- ❌ Brittle XPath -->
//div[@class='container']/div[2]/button[1]
```

```typescript
// ✅ SEQL Equivalent
import { generateSEQL } from 'seql-js';

const button = document.evaluate(
  "//div[@class='container']/div[2]/button[1]",
  document,
  null,
  XPathResult.FIRST_ORDERED_NODE_TYPE,
  null
).singleNodeValue;

if (button) {
  const selector = generateSEQL(button);
  // More stable semantic selector
}
```

## Migration Strategy

### Step 1: Identify Critical Elements

```typescript
import { generateSEQL } from 'seql-js';

// Find all elements you currently select with CSS/XPath
const criticalElements = [
  document.querySelector('.login-button'),
  document.querySelector('#email-input'),
  document.querySelector('[data-testid="submit"]'),
];

// Generate SEQL selectors
const selectors = criticalElements
  .filter((el) => el !== null)
  .map((el) => ({ element: el, seql: generateSEQL(el!) }));

console.table(selectors);
```

### Step 2: Compare Stability

```typescript
// Old CSS selector
const oldSelector = '.form-container > div:nth-child(2) > input[type="email"]';

// New SEQL selector
const input = document.querySelector(oldSelector);
const newSelector = generateSEQL(input);
// "v1: form :: input[type="email",name="email"]"

console.log('Old:', oldSelector);
console.log('New:', newSelector);
// New selector survives DOM restructuring
```

### Step 3: Gradual Migration

```typescript
import { resolveSEQL } from 'seql-js';

// Wrapper function for gradual migration
function findElement(seqlSelector: string, fallbackCSS: string): Element | null {
  // Try SEQL first
  const seqlResult = resolveSEQL(seqlSelector, document);
  if (seqlResult.length > 0) {
    return seqlResult[0];
  }

  // Fallback to CSS
  console.warn('SEQL failed, using CSS fallback');
  return document.querySelector(fallbackCSS);
}

// Usage
const button = findElement('v1: form :: button[type="submit"]', '.form button.submit');
```

## Benefits of Migration

| Aspect            | CSS/XPath    | SEQL         |
| ----------------- | ------------ | ------------ |
| Stability         | ❌ Brittle   | ✅ Resilient |
| Readability       | ❌ Technical | ✅ Semantic  |
| Maintenance       | ❌ High      | ✅ Low       |
| Refactoring       | ❌ Breaks    | ✅ Survives  |
| Framework updates | ❌ Breaks    | ✅ Stable    |
