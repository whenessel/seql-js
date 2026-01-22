# API Reference

Complete API documentation for seql-js v1.1.0.

## Quick Navigation

- **[Core Functions](./core-functions.md)** - `generateEID()`, `resolve()`
- **[SEQL Functions](./seql-functions.md)** - `generateSEQL()`, `resolveSEQL()`, `parseSEQL()`, `stringifySEQL()`
- **[Batch API](./batch-api.md)** - `generateEIDBatch()`, batch processing
- **[Cache API](./cache-api.md)** - `createEIDCache()`, `getGlobalCache()`, cache management
- **[Types](./types.md)** - TypeScript interfaces and types

## API Overview

### Two-Tier API Design

SEQL provides two complementary APIs:

#### 1. SEQL Selector API (High-Level, String-Based)

For most use cases - simple, compact string representation:

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

const selector = generateSEQL(element); // Returns string
const elements = resolveSEQL(selector); // Returns Element[]
```

#### 2. EID/Core API (Low-Level, JSON-Based)

For advanced scenarios requiring programmatic access:

```typescript
import { generateEID, resolve } from 'seql-js';

const eid = generateEID(element); // Returns ElementIdentity (JSON)
const result = resolve(eid); // Returns ResolveResult (detailed)
```

## Function Categories

### Generation Functions

| Function             | Return Type                   | Description                         |
| -------------------- | ----------------------------- | ----------------------------------- |
| `generateSEQL()`     | `string \| null`              | Generate SEQL selector string       |
| `generateEID()`      | `ElementIdentity \| null`     | Generate EID JSON object            |
| `generateEIDBatch()` | `(ElementIdentity \| null)[]` | Generate EIDs for multiple elements |

### Resolution Functions

| Function        | Return Type     | Description                       |
| --------------- | --------------- | --------------------------------- |
| `resolveSEQL()` | `Element[]`     | Resolve SEQL selector to elements |
| `resolve()`     | `ResolveResult` | Resolve EID with detailed results |

### Conversion Functions

| Function          | Return Type       | Description                       |
| ----------------- | ----------------- | --------------------------------- |
| `parseSEQL()`     | `ElementIdentity` | Parse SEQL string to EID object   |
| `stringifySEQL()` | `string`          | Convert EID object to SEQL string |

### Validation Functions

| Function        | Return Type        | Description                  |
| --------------- | ------------------ | ---------------------------- |
| `validateEID()` | `ValidationResult` | Validate EID structure       |
| `isEID()`       | `boolean`          | Check if object is valid EID |

### Cache Functions

| Function           | Return Type | Description                |
| ------------------ | ----------- | -------------------------- |
| `createEIDCache()` | `EIDCache`  | Create new cache instance  |
| `getGlobalCache()` | `EIDCache`  | Get global singleton cache |

### Utility Functions

| Function                | Return Type | Description                |
| ----------------------- | ----------- | -------------------------- |
| `normalizeText()`       | `string`    | Normalize text content     |
| `filterClasses()`       | `string[]`  | Filter utility CSS classes |
| `calculateConfidence()` | `number`    | Calculate match confidence |

## Import Patterns

### Named Imports (Recommended)

```typescript
import {
  generateSEQL,
  resolveSEQL,
  generateEID,
  resolve,
  type ElementIdentity,
  type ResolveResult,
} from 'seql-js';
```

### Tree-Shakeable Imports

Import only what you need to minimize bundle size:

```typescript
// Minimal: SEQL string API only
import { generateSEQL, resolveSEQL } from 'seql-js';

// Extended: Include EID API
import { generateSEQL, resolveSEQL, generateEID, resolve } from 'seql-js';

// Advanced: Include utilities
import { generateSEQL, resolveSEQL, generateEIDBatch, createEIDCache } from 'seql-js';
```

## Common Workflows

### Workflow 1: Simple Identification

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// Generate → Store → Resolve
const selector = generateSEQL(element);
localStorage.setItem('key', selector);
const elements = resolveSEQL(localStorage.getItem('key')!, document);
```

### Workflow 2: Advanced Processing

```typescript
import { generateEID, resolve, stringifySEQL } from 'seql-js';

// Generate EID → Inspect → Convert → Resolve
const eid = generateEID(element);
console.log('Semantics:', eid?.target.semantics);

const selector = stringifySEQL(eid!);
const result = resolve(eid!, document);

if (result.status === 'success') {
  console.log('Confidence:', result.confidence);
}
```

### Workflow 3: Batch Processing

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

// Batch generate → Convert all → Send to backend
const elements = document.querySelectorAll('button, a, input');
const eids = generateEIDBatch(Array.from(elements));
const selectors = eids.filter((eid) => eid !== null).map((eid) => stringifySEQL(eid!));

await fetch('/api/elements', {
  method: 'POST',
  body: JSON.stringify(selectors),
});
```

## TypeScript Support

Full TypeScript definitions are included. Enable strict type checking:

```typescript
import { generateEID, type ElementIdentity } from 'seql-js';

const element = document.querySelector('button');

// Type-safe: may return null
const eid: ElementIdentity | null = generateEID(element);

if (eid) {
  // Type narrowing - eid is non-null here
  console.log(eid.target.tag); // Type: string
  console.log(eid.target.nthChild); //  Type: number | undefined
}
```

## Error Handling

### Null Returns

Generation functions return `null` when unable to create an identifier:

```typescript
const eid = generateEID(element);
if (eid === null) {
  console.warn('Could not generate EID - element may lack semantic features');
}
```

### Resolution Failures

Resolution returns empty array or error status:

```typescript
// SEQL API
const elements = resolveSEQL(selector, document);
if (elements.length === 0) {
  console.warn('No elements found');
}

// EID API (more detailed)
const result = resolve(eid, document);
if (result.status === 'error') {
  console.error('Resolution failed:', result.message);
}
```

## Performance Considerations

### Use Caching

```typescript
import { getGlobalCache } from 'seql-js';

// Cache is used automatically, but you can access it
const cache = getGlobalCache();
console.log('Cache stats:', cache.getStats());
```

### Use Batch Processing

```typescript
// ❌ Bad: Individual calls in loop
elements.forEach((el) => generateEID(el));

// ✅ Good: Batch processing
generateEIDBatch(elements);
```

### Scope Resolution

```typescript
// ❌ Bad: Search entire document
resolveSEQL(selector, document);

// ✅ Good: Search within container
const container = document.querySelector('.modal');
resolveSEQL(selector, container!);
```

## Browser Compatibility

- Modern browsers with ES2015+ support
- No polyfills required for DOM APIs
- Tested on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Next Steps

- [Core Functions](./core-functions.md) - Detailed API for `generateEID()` and `resolve()`
- [SEQL Functions](./seql-functions.md) - String-based API reference
- [Batch API](./batch-api.md) - Efficient batch processing
- [Cache API](./cache-api.md) - Performance optimization
- [Types](./types.md) - TypeScript type reference
