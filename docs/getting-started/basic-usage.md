# Basic Usage

This guide covers the most common SEQL patterns you'll use in your projects.

## Pattern 1: Generate and Resolve SEQL Selectors

The most common workflow: generate a selector from an element, send it somewhere, and resolve it later.

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// Step 1: Generate SEQL selector from a DOM element
const button = document.querySelector('.submit-button');
const selector = generateSEQL(button);
console.log(selector);
// Output: "v1: form :: div.actions > button[type="submit",text="Order Now"]"

// Step 2: Store or send the selector
localStorage.setItem('lastClickedElement', selector);
// or send to analytics: gtag('event', 'click', { element: selector });

// Step 3: Later, resolve the selector back to the element
const restoredSelector = localStorage.getItem('lastClickedElement');
const elements = resolveSEQL(restoredSelector!, document);

if (elements.length > 0) {
  console.log('Found element:', elements[0]);
} else {
  console.log('Element not found');
}
```

## Pattern 2: Working with EID Objects

For advanced use cases requiring programmatic access to semantic structure:

```typescript
import { generateEID, resolve } from 'seql-js';

// Generate EID (JSON object)
const button = document.querySelector('.submit-button');
const eid = generateEID(button);

console.log('EID structure:', eid);
// Output: {
//   anchor: { tag: 'form', semantics: {...}, nthChild: 1 },
//   path: [...],
//   target: { tag: 'button', semantics: {...}, nthChild: 2 },
//   constraints: {...}
// }

// Resolve EID back to element(s)
const result = resolve(eid, document);

if (result.status === 'success') {
  console.log('Found:', result.elements[0]);
  console.log('Confidence:', result.confidence);
} else if (result.status === 'ambiguous') {
  console.log('Multiple matches found:', result.elements);
} else {
  console.log('Resolution failed:', result.status);
}
```

## Pattern 3: Tracking User Interactions

Track clicks, inputs, and other user actions with semantic identifiers:

```typescript
import { generateSEQL } from 'seql-js';

// Track all button clicks
document.addEventListener('click', (event) => {
  const target = event.target as Element;

  if (target.tagName === 'BUTTON' || target.closest('button')) {
    const button = target.closest('button') || target;
    const selector = generateSEQL(button);

    // Send to analytics
    gtag('event', 'button_click', {
      element_selector: selector,
      timestamp: Date.now(),
    });
  }
});

// Track form inputs
document.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement;

  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    const selector = generateSEQL(target);

    console.log(`User interacted with: ${selector}`);
  }
});
```

## Pattern 4: Batch Processing

Generate selectors for multiple elements efficiently:

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

// Get all interactive elements on the page
const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');

// Generate EIDs in batch (more efficient than individual calls)
const eids = generateEIDBatch(Array.from(interactiveElements));

// Convert to SEQL selectors
const selectors = eids.filter((eid) => eid !== null).map((eid) => stringifySEQL(eid!));

console.log(`Generated ${selectors.length} selectors`);

// Send batch to analytics
fetch('/api/analytics/elements', {
  method: 'POST',
  body: JSON.stringify({ selectors }),
});
```

## Pattern 5: Custom Options

Configure generation and resolution behavior:

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// Custom generator options
const button = document.querySelector('button');
const selector = generateSEQL(
  button,
  {
    maxPathDepth: 5, // Limit path depth (default: 10)
    enableSvgFingerprint: true, // Enable SVG fingerprinting (default: true)
    confidenceThreshold: 0.3, // Minimum confidence score (default: 0.0, v1.3.0+)
  },
  {
    verbose: false, // Compact selector format (default: false)
  }
);

// Custom resolver options
const elements = resolveSEQL(selector, document, {
  strictMode: false, // Allow degraded matches (default: false)
  requireUniqueness: true, // Require single match (default: false)
});
```

## Error Handling

Always check results when resolving selectors:

```typescript
import { resolveSEQL } from 'seql-js';

const selector = 'v1: form :: button[type="submit"]';

try {
  const elements = resolveSEQL(selector, document);

  if (elements.length === 0) {
    console.warn('Element not found - may have been removed');
  } else if (elements.length > 1) {
    console.warn('Multiple matches - selector may be ambiguous');
  } else {
    const element = elements[0];
    // Use element safely
    element.click();
  }
} catch (error) {
  console.error('Failed to resolve selector:', error);
}
```

## Working with Dynamic Content

Handle elements that may not exist yet:

```typescript
import { resolveSEQL } from 'seql-js';

const waitForElement = async (selector: string, timeout = 5000): Promise<Element | null> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const elements = resolveSEQL(selector, document);
    if (elements.length > 0) {
      return elements[0];
    }

    // Wait 100ms before trying again
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return null;
};

// Usage
const modalButton = await waitForElement('v1: div[role="dialog"] :: button[text="Close"]');
if (modalButton) {
  modalButton.click();
} else {
  console.log('Modal button not found within timeout');
}
```

## Common Pitfalls

### 1. Don't Cache DOM Elements, Cache Selectors

❌ **Bad**: Caching DOM elements directly

```typescript
const cachedElement = document.querySelector('.submit'); // Element may become stale
```

✅ **Good**: Cache SEQL selectors and resolve when needed

```typescript
const selector = generateSEQL(document.querySelector('.submit'));
// Later...
const element = resolveSEQL(selector, document)[0];
```

### 2. Handle Multiple Matches

❌ **Bad**: Assuming single match

```typescript
const element = resolveSEQL(selector, document)[0]; // May be undefined
element.click(); // Error if no matches
```

✅ **Good**: Check array length

```typescript
const elements = resolveSEQL(selector, document);
if (elements.length > 0) {
  elements[0].click();
}
```

### 3. Use Appropriate Root Context

❌ **Bad**: Always using `document`

```typescript
const element = resolveSEQL(selector, document); // Searches entire document
```

✅ **Good**: Scope to specific container when possible

```typescript
const modal = document.querySelector('.modal');
const button = resolveSEQL(selector, modal)[0]; // Searches only within modal
```

## Next Steps

- [Concepts](./concepts.md) - Deep dive into EID and SEQL
- [API Reference](../api/) - Complete API documentation
- [Examples](../examples/) - More real-world examples
- [Guides](../guides/) - Advanced topics
