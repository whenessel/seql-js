# Core Functions

Low-level EID/Core API for advanced element identification workflows.

## generateEID()

Generates an Element Identity Descriptor (EID) from a DOM element.

### Signature

```typescript
function generateEID(target: Element, options?: GeneratorOptions): ElementIdentity | null;
```

### Parameters

| Parameter | Type               | Required | Description                            |
| --------- | ------------------ | -------- | -------------------------------------- |
| `target`  | `Element`          | Yes      | The DOM element to generate an EID for |
| `options` | `GeneratorOptions` | No       | Configuration options for generation   |

### Returns

- **`ElementIdentity`** - EID JSON object with anchor, path, target, and constraints
- **`null`** - If generation failed (element lacks semantic features or isn't connected to DOM)

### Generator Options

```typescript
interface GeneratorOptions {
  maxPathDepth?: number; // Max depth for path building (default: 10)
  enableSvgFingerprint?: boolean; // Enable SVG fingerprinting (default: true)
  confidenceThreshold?: number; // Min confidence threshold (default: 0.1)
  fallbackToBody?: boolean; // Use <body> if no anchor found (default: true)
  cache?: EIDCache; // Custom cache instance (default: global cache)
}
```

### Examples

#### Basic Usage

```typescript
import { generateEID } from 'seql-js';

const button = document.querySelector('.submit-button');
const eid = generateEID(button);

if (eid) {
  console.log('Generated EID:', eid);
  console.log('Anchor tag:', eid.anchor.tag);
  console.log('Target tag:', eid.target.tag);
  console.log('Confidence:', eid.meta.confidence);
} else {
  console.warn('Could not generate EID for this element');
}
```

#### With Custom Options

```typescript
import { generateEID } from 'seql-js';

const input = document.querySelector('input[type="email"]');
const eid = generateEID(input, {
  maxPathDepth: 5, // Shorter path for performance
  enableSvgFingerprint: false, // Disable SVG processing
  confidenceThreshold: 0.3, // Higher quality threshold
});
```

#### Custom Cache

```typescript
import { generateEID, createEIDCache } from 'seql-js';

// Create dedicated cache for session
const sessionCache = createEIDCache({ maxSize: 500 });

const element = document.querySelector('button');
const eid = generateEID(element, { cache: sessionCache });
```

### Return Structure

```typescript
interface ElementIdentity {
  version: string; // EID format version (e.g., "1.0")

  anchor: AnchorNode; // Semantic root element
  path: PathNode[]; // Semantic traversal
  target: TargetNode; // The element itself

  constraints?: Constraint[]; // Disambiguation rules
  fallbackRules?: FallbackRules; // Fallback resolution rules

  meta: {
    confidence: number; // Quality score (0-1)
    generatedAt: string; // ISO timestamp
    degraded: boolean; // True if ideal conditions not met
    degradationReason?: string; // Why degraded (if applicable)
  };
}
```

#### Anchor Node

```typescript
interface AnchorNode {
  tag: string; // Tag name (e.g., "form", "main")
  semantics: ElementSemantics; // Semantic features
  nthChild?: number; // Position among siblings (v1.1.0)
}
```

#### Target Node

```typescript
interface TargetNode {
  tag: string; // Tag name (e.g., "button", "input")
  semantics: ElementSemantics; // Semantic features
  nthChild?: number; // Position among siblings (v1.1.0)
}
```

### When Generation Fails

`generateEID()` returns `null` in these cases:

1. **Element not connected to DOM**

   ```typescript
   const orphan = document.createElement('button');
   generateEID(orphan); // Returns null
   ```

2. **Element lacks owner document**

   ```typescript
   const detached = document.createElement('div');
   generateEID(detached); // Returns null
   ```

3. **Confidence below threshold** (with custom threshold)

   ```typescript
   generateEID(element, { confidenceThreshold: 0.9 }); // May return null
   ```

### Performance Notes

- **Caching**: Results are cached automatically using global cache or custom cache
- **Cache hits**: Subsequent calls for same element return cached EID instantly
- **Path depth**: Lower `maxPathDepth` improves performance but may reduce specificity
- **SVG fingerprinting**: Disable for non-SVG documents to improve performance

---

## resolve()

Resolves an Element Identity Descriptor back to DOM element(s).

### Signature

```typescript
function resolve(
  eid: ElementIdentity,
  dom: Document | Element,
  options?: ResolverOptions
): ResolveResult;
```

### Parameters

| Parameter | Type                  | Required | Description                                    |
| --------- | --------------------- | -------- | ---------------------------------------------- |
| `eid`     | `ElementIdentity`     | Yes      | The EID to resolve                             |
| `dom`     | `Document \| Element` | Yes      | Document or container element to search within |
| `options` | `ResolverOptions`     | No       | Configuration options for resolution           |

### Returns

Always returns a `ResolveResult` object with status, elements, and metadata.

### Resolver Options

```typescript
interface ResolverOptions {
  strictMode?: boolean; // Reject degraded matches (default: false)
  requireUniqueness?: boolean; // Fail if multiple matches (default: false)
  enableFallback?: boolean; // Try fallback resolution (default: true)
  maxCandidates?: number; // Max candidates to consider (default: 100)
}
```

### Examples

#### Basic Usage

```typescript
import { resolve } from 'seql-js';

const eid = {...}; // Previously generated EID
const result = resolve(eid, document);

console.log('Status:', result.status);
console.log('Elements:', result.elements);
console.log('Confidence:', result.confidence);
```

#### Handling Different Statuses

```typescript
import { resolve } from 'seql-js';

const result = resolve(eid, document);

switch (result.status) {
  case 'success':
    // Single match found
    const element = result.elements[0];
    console.log('Found element:', element);
    element.click();
    break;

  case 'ambiguous':
    // Multiple matches found
    console.warn(`Found ${result.elements.length} matches`);
    result.elements.forEach((el, i) => {
      console.log(`Match ${i + 1}:`, el);
    });
    break;

  case 'degraded-fallback':
    // Partial match with reduced confidence
    console.warn('Found with fallback:', result.elements[0]);
    console.log('Degradation reason:', result.meta.degradationReason);
    break;

  case 'error':
    // No matches found
    console.error('Element not found');
    result.warnings.forEach((w) => console.warn(w));
    break;
}
```

#### Strict Mode

```typescript
import { resolve } from 'seql-js';

// Only accept perfect matches
const result = resolve(eid, document, {
  strictMode: true,
  requireUniqueness: true,
});

if (result.status === 'success') {
  // Guaranteed single, high-confidence match
  const element = result.elements[0];
  element.focus();
}
```

#### Scoped Resolution

```typescript
import { resolve } from 'seql-js';

// Search only within modal
const modal = document.querySelector('.modal');
if (modal) {
  const result = resolve(eid, modal); // Scoped to modal
  // ...
}
```

### Return Structure

```typescript
interface ResolveResult {
  status: 'success' | 'ambiguous' | 'degraded-fallback' | 'error';
  elements: Element[]; // Matched elements (0 or more)
  warnings: string[]; // Warning messages
  confidence: number; // Match confidence (0-1)
  meta: {
    degraded: boolean; // True if match quality is reduced
    degradationReason?: string; // Why degraded (if applicable)
  };
}
```

### Status Values

| Status              | Description                | Elements Count | Confidence              |
| ------------------- | -------------------------- | -------------- | ----------------------- |
| `success`           | Perfect match              | 1              | Original EID confidence |
| `ambiguous`         | Multiple matches           | 2+             | Original EID confidence |
| `degraded-fallback` | Partial match via fallback | 1+             | Reduced (< original)    |
| `error`             | No matches found           | 0              | 0                       |

### Resolution Algorithm (5 Phases)

The resolver uses a multi-phase algorithm for robustness:

### Phase 1: CSS Narrowing

- Generate optimized CSS selector from EID
- Query DOM using native browser APIs
- Narrow candidate set

### Phase 2: Semantic Filtering

- Score candidates by semantic similarity
- Filter low-scoring matches
- Prioritize semantically similar elements

### Phase 3: Uniqueness Check

- If exactly 1 candidate remains, return early (status: `success`)
- Skip phases 4-5 for performance

### Phase 4: Constraints Evaluation

- Apply uniqueness, visibility, text proximity constraints
- Filter candidates that don't meet constraints

### Phase 5: Ambiguity Handling

- Multiple matches: return all (status: `ambiguous`)
- No matches + fallback enabled: try fallback rules (status: `degraded-fallback`)
- No matches + no fallback: return error (status: `error`)

### Common Patterns

#### Safe Element Access

```typescript
const result = resolve(eid, document);
const element = result.elements[0];

if (element) {
  // Safe to use element
  element.click();
}
```

#### Confidence-Based Logic

```typescript
const result = resolve(eid, document);

if (result.confidence > 0.8) {
  // High confidence - safe to auto-click
  result.elements[0]?.click();
} else if (result.confidence > 0.5) {
  // Medium confidence - highlight for user
  result.elements[0]?.scrollIntoView();
} else {
  // Low confidence - manual intervention
  console.warn('Low confidence match:', result.confidence);
}
```

#### Retry with Fallback Disabled

```typescript
// Try strict resolution first
let result = resolve(eid, document, {
  enableFallback: false,
  requireUniqueness: true,
});

if (result.status !== 'success') {
  // Retry with fallback
  result = resolve(eid, document, {
    enableFallback: true,
  });
}
```

### Performance Notes

- **Scoped resolution**: Search within container instead of entire document
- **Max candidates**: Limit candidate set for large DOMs
- **CSS selector caching**: Browser caches compiled selectors
- **Early exit**: Phase 3 exits early on unique match (most common case)

## Comparison: generateEID() vs generateSEQL()

| Aspect      | generateEID()            | generateSEQL()         |
| ----------- | ------------------------ | ---------------------- |
| Return type | `ElementIdentity` (JSON) | `string`               |
| Use case    | Advanced, programmatic   | Simple, storage        |
| Size        | ~500-2000 bytes          | ~100-300 bytes         |
| Parsing     | Native JSON              | SEQL parser required   |
| Metadata    | Full semantic structure  | Compact representation |
| Performance | Slightly slower          | Slightly faster        |

## Comparison: resolve() vs resolveSEQL()

| Aspect      | resolve()                  | resolveSEQL()        |
| ----------- | -------------------------- | -------------------- |
| Input       | `ElementIdentity` (JSON)   | `string`             |
| Return type | `ResolveResult` (detailed) | `Element[]` (simple) |
| Status info | Yes (4 statuses)           | No (just array)      |
| Confidence  | Yes                        | No                   |
| Warnings    | Yes                        | No                   |
| Use case    | Advanced, debugging        | Simple, quick        |

## Next Steps

- [SEQL Functions](./seql-functions.md) - High-level string-based API
- [Batch API](./batch-api.md) - Process multiple elements
- [Types](./types.md) - TypeScript type definitions
- [Examples](../examples/) - Real-world usage patterns
