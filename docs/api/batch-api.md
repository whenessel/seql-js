# Batch API

Efficiently generate EIDs for multiple elements at once.

## generateEIDBatch()

Generates Element Identity Descriptors for multiple elements in a single optimized call.

### Signature

```typescript
function generateEIDBatch(
  elements: Element[],
  options?: GeneratorOptions
): (ElementIdentity | null)[]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `elements` | `Element[]` | Yes | Array of DOM elements to process |
| `options` | `GeneratorOptions` | No | Shared options for all generations |

### Returns

- **`(ElementIdentity | null)[]`** - Array of EIDs (same length as input, `null` for failed generations)

### Performance Benefits

Batch processing provides significant performance improvements:

- **Shared cache**: All elements use the same cache instance
- **Optimized anchor finding**: Common anchors are cached
- **Reduced overhead**: Single function call vs. multiple individual calls
- **Better memory usage**: Reuses semantic extractor instances

**Performance gain**: 30-50% faster than individual `generateEID()` calls for 10+ elements.

### Examples

#### Basic Batch Generation

```typescript
import { generateEIDBatch } from 'seql-js';

// Get all buttons on the page
const buttons = Array.from(document.querySelectorAll('button'));

// Generate EIDs for all buttons at once
const eids = generateEIDBatch(buttons);

// Filter out failed generations
const validEIDs = eids.filter(eid => eid !== null);

console.log(`Generated ${validEIDs.length}/${buttons.length} EIDs`);
```

#### Convert to SEQL Selectors

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

const interactiveElements = Array.from(
  document.querySelectorAll('button, a, input, select, textarea')
);

const eids = generateEIDBatch(interactiveElements);

// Convert all to SEQL selectors
const selectors = eids
  .filter(eid => eid !== null)
  .map(eid => stringifySEQL(eid!));

console.log(`Generated ${selectors.length} selectors`);
```

#### Send to Analytics

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

async function trackPageElements() {
  // Get all trackable elements
  const elements = Array.from(
    document.querySelectorAll('[data-track]')
  );

  // Generate EIDs in batch
  const eids = generateEIDBatch(elements);

  // Convert to selectors and send to backend
  const selectors = eids
    .filter(eid => eid !== null)
    .map(eid => stringifySEQL(eid!));

  await fetch('/api/analytics/page-elements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: window.location.href,
      selectors
    })
  });
}

// Run on page load
trackPageElements();
```

#### With Custom Options

```typescript
import { generateEIDBatch } from 'seql-js';

const forms = Array.from(document.querySelectorAll('form'));

const eids = generateEIDBatch(forms, {
  maxPathDepth: 5,              // Shorter paths
  enableSvgFingerprint: false,  // No SVG processing needed
  confidenceThreshold: 0.3      // Higher quality threshold
});
```

#### Parallel Processing with Map

```typescript
import { generateEIDBatch } from 'seql-js';

const sections = Array.from(document.querySelectorAll('section'));

// Generate EIDs for all sections
const sectionEIDs = generateEIDBatch(sections);

// Create a map of section → EID
const sectionMap = new Map(
  sections.map((section, index) => [section, sectionEIDs[index]])
);

// Later, look up EID for a specific section
const targetSection = document.querySelector('#products');
const eid = sectionMap.get(targetSection);
```

## Common Patterns

### Pattern 1: Page Snapshot

Generate identifiers for all interactive elements on page load:

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

function capturePageSnapshot() {
  const interactive = Array.from(
    document.querySelectorAll('a, button, input, select, textarea, [role="button"]')
  );

  const eids = generateEIDBatch(interactive);
  const selectors = eids
    .filter(eid => eid !== null)
    .map(eid => stringifySEQL(eid!));

  return {
    url: window.location.href,
    timestamp: Date.now(),
    elementCount: interactive.length,
    selectors
  };
}

// Send snapshot to analytics
const snapshot = capturePageSnapshot();
console.log(`Captured ${snapshot.selectors.length} elements`);
```

### Pattern 2: Form Field Mapping

Create identifiers for all form fields:

```typescript
import { generateEIDBatch } from 'seql-js';

function mapFormFields(form: HTMLFormElement) {
  const fields = Array.from(
    form.querySelectorAll('input, select, textarea')
  ) as HTMLInputElement[];

  const eids = generateEIDBatch(fields);

  // Create field name → EID mapping
  const fieldMap = new Map(
    fields.map((field, index) => [
      field.name || field.id,
      eids[index]
    ])
  );

  return fieldMap;
}

// Usage
const loginForm = document.querySelector('#login-form') as HTMLFormElement;
const fieldIdentifiers = mapFormFields(loginForm);
```

### Pattern 3: Incremental Processing

Process elements in chunks for very large DOMs:

```typescript
import { generateEIDBatch } from 'seql-js';

async function processLargeDOM(selector: string, chunkSize = 100) {
  const allElements = Array.from(document.querySelectorAll(selector));
  const allEIDs: (ElementIdentity | null)[] = [];

  // Process in chunks
  for (let i = 0; i < allElements.length; i += chunkSize) {
    const chunk = allElements.slice(i, i + chunkSize);
    const chunkEIDs = generateEIDBatch(chunk);

    allEIDs.push(...chunkEIDs);

    // Yield to browser between chunks
    await new Promise(resolve => setTimeout(resolve, 0));

    console.log(`Processed ${Math.min(i + chunkSize, allElements.length)}/${allElements.length}`);
  }

  return allEIDs;
}

// Usage
const eids = await processLargeDOM('div, span, p', 100);
```

### Pattern 4: Comparison Across Sessions

Generate and compare element sets:

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

function comparePageElements() {
  const currentElements = Array.from(
    document.querySelectorAll('[data-important]')
  );

  const currentEIDs = generateEIDBatch(currentElements);
  const currentSelectors = currentEIDs
    .filter(eid => eid !== null)
    .map(eid => stringifySEQL(eid!));

  // Load previous session
  const previousSelectors = JSON.parse(
    localStorage.getItem('previousSelectors') || '[]'
  );

  // Find added/removed elements
  const added = currentSelectors.filter(
    sel => !previousSelectors.includes(sel)
  );
  const removed = previousSelectors.filter(
    sel => !currentSelectors.includes(sel)
  );

  console.log(`Added: ${added.length}, Removed: ${removed.length}`);

  // Save current state
  localStorage.setItem('previousSelectors', JSON.stringify(currentSelectors));

  return { added, removed };
}
```

## Performance Benchmarks

Typical performance characteristics (1000 elements):

| Method | Time | Memory |
|--------|------|--------|
| Individual `generateEID()` calls | ~2500ms | ~15MB |
| `generateEIDBatch()` | ~1500ms | ~10MB |
| **Improvement** | **40% faster** | **33% less memory** |

### Optimization Tips

**✅ Do:**
- Use batch processing for 10+ elements
- Process similar elements together (all buttons, all inputs)
- Reuse the same options object for all batches

**❌ Don't:**
- Batch drastically different element types (forms + tiny divs)
- Process 10,000+ elements in a single batch (use chunking)
- Generate batch EIDs in tight loops (batch the loop instead)

## Error Handling

Individual element failures don't stop batch processing:

```typescript
import { generateEIDBatch } from 'seql-js';

const elements = [
  document.createElement('div'),  // Not connected to DOM
  document.querySelector('button'),  // Valid
  null,  // Invalid input
  document.querySelector('input')   // Valid
];

const eids = generateEIDBatch(elements.filter(el => el !== null) as Element[]);

// Result: [null, ElementIdentity, null, ElementIdentity]
console.log('Successful:', eids.filter(eid => eid !== null).length);
console.log('Failed:', eids.filter(eid => eid === null).length);
```

## When to Use Batch vs Individual

### Use `generateEIDBatch()` when:
- Processing 10+ elements at once
- Capturing page snapshots
- Initial page load analytics
- Bulk export/import operations

### Use `generateEID()` when:
- Processing single elements on-demand
- Event handlers (click, input)
- Real-time user interaction tracking
- Elements are processed at different times

## Combining with Other APIs

### Batch Generation + Individual Resolution

```typescript
import { generateEIDBatch, resolve } from 'seql-js';

// Generate batch at page load
const buttons = Array.from(document.querySelectorAll('button'));
const buttonEIDs = generateEIDBatch(buttons);

// Store in WeakMap for later lookup
const eidMap = new WeakMap(
  buttons.map((btn, i) => [btn, buttonEIDs[i]])
);

// Later, resolve individual elements
document.addEventListener('click', (event) => {
  const target = event.target as Element;
  const button = target.closest('button');

  if (button) {
    const eid = eidMap.get(button);
    if (eid) {
      const result = resolve(eid, document);
      console.log('Clicked button confidence:', result.confidence);
    }
  }
});
```

### Batch with Custom Cache

```typescript
import { generateEIDBatch, createEIDCache } from 'seql-js';

// Create dedicated cache for this batch
const batchCache = createEIDCache({ maxSize: 1000 });

const elements = Array.from(document.querySelectorAll('div'));
const eids = generateEIDBatch(elements, {
  cache: batchCache
});

// Cache is warm for future operations
console.log('Cache stats:', batchCache.getStats());
```

## TypeScript Types

```typescript
import type { ElementIdentity, GeneratorOptions } from 'seql-js';

function generateEIDBatch(
  elements: Element[],
  options?: GeneratorOptions
): (ElementIdentity | null)[];
```

## Next Steps

- [Core Functions](./core-functions.md) - Individual element generation
- [Cache API](./cache-api.md) - Optimize performance with caching
- [Examples](../examples/basic-examples.md) - Real-world usage
- [Performance Guide](../troubleshooting/performance.md) - Optimization tips
