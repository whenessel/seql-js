# SEQL Functions

High-level string-based API for simple, compact element identification.

## generateSEQL()

Convenience function that combines `generateEID()` + `stringifySEQL()` into a single call.

### Signature

```typescript
function generateSEQL(
  element: Element,
  generatorOptions?: GeneratorOptions,
  stringifyOptions?: StringifyOptions
): string | null;
```

### Parameters

| Parameter          | Type               | Required | Description                                |
| ------------------ | ------------------ | -------- | ------------------------------------------ |
| `element`          | `Element`          | Yes      | The DOM element to generate a selector for |
| `generatorOptions` | `GeneratorOptions` | No       | Options for EID generation                 |
| `stringifyOptions` | `StringifyOptions` | No       | Options for SEQL string formatting         |

### Returns

- **`string`** - Compact SEQL selector string
- **`null`** - If generation failed

### Stringify Options

```typescript
interface StringifyOptions {
  verbose?: boolean; // Include all details (default: false)
  includeNthChild?: boolean; // Include nth-child positions (default: true)
}
```

### Examples

#### Basic Usage

```typescript
import { generateSEQL } from 'seql-js';

const button = document.querySelector('.submit-button');
const selector = generateSEQL(button);

console.log(selector);
// Output: "v1: form :: div.actions > button[type="submit",text="Order Now"]"
```

#### Compact Format

```typescript
import { generateSEQL } from 'seql-js';

const input = document.querySelector('input[type="email"]');
const selector = generateSEQL(
  input,
  { maxPathDepth: 5 },
  { verbose: false } // Compact format (default)
);

console.log(selector);
// Output: "v1: form :: input[type="email",name="email"]"
```

#### Verbose Format

```typescript
import { generateSEQL } from 'seql-js';

const link = document.querySelector('a');
const selector = generateSEQL(
  link,
  {},
  { verbose: true } // Include all semantic details
);

console.log(selector);
// Output: "v1: nav[role="navigation",aria-label="Main"] :: ul.menu > li[nthChild=2] > a[href="/about",text="About Us"]"
```

### SEQL Selector Format

SEQL selectors follow this format:

```
v1: <anchor> :: <path> > <target>
```

**Components**:

- `v1:` - Version prefix
- `<anchor>` - Semantic root element with attributes
- `::` - Anchor-to-path separator
- `<path>` - Semantic traversal (`>` separated)
- `<target>` - Target element with attributes

**Example Breakdown**:

```
v1: form[aria-label="Login"] :: div.fields > input[type="email",name="email"]
│   └──────anchor──────────┘    └──path──┘   └─────────target──────────────┘
└─ version
```

---

## resolveSEQL()

Convenience function that combines `parseSEQL()` + `resolve()` into a single call.

### Signature

```typescript
function resolveSEQL(
  selector: string,
  dom: Document | Element,
  options?: ResolverOptions
): Element[];
```

### Parameters

| Parameter  | Type                  | Required | Description                            |
| ---------- | --------------------- | -------- | -------------------------------------- |
| `selector` | `string`              | Yes      | The SEQL selector to resolve           |
| `dom`      | `Document \| Element` | Yes      | Document or container to search within |
| `options`  | `ResolverOptions`     | No       | Options for resolution                 |

### Returns

- **`Element[]`** - Array of matched elements (may be empty)

### Examples

#### Basic Usage

```typescript
import { resolveSEQL } from 'seql-js';

const selector = 'v1: form :: button[type="submit"]';
const elements = resolveSEQL(selector, document);

if (elements.length > 0) {
  console.log('Found button:', elements[0]);
  elements[0].click();
} else {
  console.log('Button not found');
}
```

#### Scoped Resolution

```typescript
import { resolveSEQL } from 'seql-js';

// Search only within modal
const modal = document.querySelector('.modal');
const selector = 'v1: div[role="dialog"] :: button[text="Close"]';

if (modal) {
  const buttons = resolveSEQL(selector, modal);
  buttons[0]?.click();
}
```

#### Strict Resolution

```typescript
import { resolveSEQL } from 'seql-js';

const selector = 'v1: form :: input[name="email"]';
const elements = resolveSEQL(selector, document, {
  strictMode: true,
  requireUniqueness: true,
});

// Will only return element if exactly 1 high-confidence match
if (elements.length === 1) {
  elements[0].focus();
}
```

### Error Handling

Unlike `resolve()`, `resolveSEQL()` returns an empty array instead of detailed error information.

```typescript
const elements = resolveSEQL(invalidSelector, document);

if (elements.length === 0) {
  // Could be: parse error, no matches, or resolution failure
  console.warn('No elements found');
}
```

For detailed error information, use `parseSEQL()` + `resolve()`:

```typescript
try {
  const eid = parseSEQL(selector);
  const result = resolve(eid, document);

  console.log('Status:', result.status);
  console.log('Warnings:', result.warnings);
} catch (error) {
  console.error('Parse error:', error);
}
```

---

## parseSEQL()

Parses a SEQL selector string into an `ElementIdentity` object.

### Signature

```typescript
function parseSEQL(selector: string): ElementIdentity;
```

### Parameters

| Parameter  | Type     | Required | Description                   |
| ---------- | -------- | -------- | ----------------------------- |
| `selector` | `string` | Yes      | SEQL selector string to parse |

### Returns

- **`ElementIdentity`** - Parsed EID object

### Throws

- **`Error`** - If selector format is invalid

### Examples

#### Basic Parsing

```typescript
import { parseSEQL } from 'seql-js';

const selector = 'v1: form :: button[type="submit"]';
const eid = parseSEQL(selector);

console.log('Anchor tag:', eid.anchor.tag); // "form"
console.log('Target tag:', eid.target.tag); // "button"
console.log('Target type:', eid.target.semantics.attributes.type); // "submit"
```

#### Parse Then Resolve

```typescript
import { parseSEQL, resolve } from 'seql-js';

try {
  const selector = 'v1: main :: div.content > p[text="Hello"]';
  const eid = parseSEQL(selector);

  // Now you can inspect the EID
  console.log('Path length:', eid.path.length);
  console.log('Target semantics:', eid.target.semantics);

  // Resolve with custom options
  const result = resolve(eid, document, {
    strictMode: true,
  });

  console.log('Status:', result.status);
} catch (error) {
  console.error('Invalid selector:', error.message);
}
```

#### Error Handling

```typescript
import { parseSEQL } from 'seql-js';

try {
  const eid = parseSEQL('invalid selector format');
} catch (error) {
  console.error('Parse failed:', error.message);
  // Error: Invalid SEQL selector format
}
```

---

## stringifySEQL()

Converts an `ElementIdentity` object into a SEQL selector string.

### Signature

```typescript
function stringifySEQL(eid: ElementIdentity, options?: StringifyOptions): string;
```

### Parameters

| Parameter | Type               | Required | Description        |
| --------- | ------------------ | -------- | ------------------ |
| `eid`     | `ElementIdentity`  | Yes      | The EID to convert |
| `options` | `StringifyOptions` | No       | Formatting options |

### Returns

- **`string`** - SEQL selector string

### Examples

#### Basic Stringify

```typescript
import { generateEID, stringifySEQL } from 'seql-js';

const button = document.querySelector('button');
const eid = generateEID(button);

if (eid) {
  const selector = stringifySEQL(eid);
  console.log(selector);
  // Output: "v1: form :: button[type="submit"]"
}
```

#### Verbose Format

```typescript
import { generateEID, stringifySEQL } from 'seql-js';

const input = document.querySelector('input');
const eid = generateEID(input);

if (eid) {
  const verboseSelector = stringifySEQL(eid, { verbose: true });
  console.log(verboseSelector);
  // Includes all semantic attributes, nth-child positions, etc.
}
```

#### Without nth-child

```typescript
import { generateEID, stringifySEQL } from 'seql-js';

const element = document.querySelector('.item');
const eid = generateEID(element);

if (eid) {
  const selector = stringifySEQL(eid, { includeNthChild: false });
  // Omits nth-child positions for broader matching
  console.log(selector);
}
```

---

## Common Workflows

### Workflow 1: Generate and Store

```typescript
import { generateSEQL } from 'seql-js';

// Generate selector for analytics
document.addEventListener('click', (event) => {
  const target = event.target as Element;
  const selector = generateSEQL(target);

  if (selector) {
    // Send to analytics
    gtag('event', 'click', { element: selector });

    // Or store locally
    localStorage.setItem('lastClick', selector);
  }
});
```

### Workflow 2: Retrieve and Resolve

```typescript
import { resolveSEQL } from 'seql-js';

// Retrieve stored selector
const storedSelector = localStorage.getItem('lastClick');

if (storedSelector) {
  const elements = resolveSEQL(storedSelector, document);

  if (elements.length > 0) {
    // Highlight the element
    elements[0].scrollIntoView({ behavior: 'smooth' });
    elements[0].classList.add('highlight');
  }
}
```

### Workflow 3: Parse, Modify, Stringify

```typescript
import { parseSEQL, stringifySEQL } from 'seql-js';

const selector = 'v1: form :: input[type="text"]';
const eid = parseSEQL(selector);

// Modify the EID programmatically
eid.target.semantics.attributes.name = 'username';

// Convert back to string
const modifiedSelector = stringifySEQL(eid);
console.log(modifiedSelector);
// Output: "v1: form :: input[type="text",name="username"]"
```

### Workflow 4: Convert Between Formats

```typescript
import { generateEID, resolveSEQL, stringifySEQL } from 'seql-js';

// EID → SEQL
const element = document.querySelector('button');
const eid = generateEID(element);
const selector = stringifySEQL(eid!);

// SEQL → Elements
const elements = resolveSEQL(selector, document);
```

## Performance Considerations

### Use SEQL for Most Cases

```typescript
// ✅ Good: Simple string-based workflow
import { generateSEQL, resolveSEQL } from 'seql-js';

const selector = generateSEQL(element);
const elements = resolveSEQL(selector, document);
```

### Use EID When Needed

```typescript
// ✅ Good: When you need metadata
import { generateEID, resolve } from 'seql-js';

const eid = generateEID(element);
if (eid && eid.meta.confidence > 0.8) {
  const result = resolve(eid, document);
  console.log('High confidence match');
}
```

### Cache Selectors, Not Elements

```typescript
// ❌ Bad: Caching DOM elements
const cachedButton = document.querySelector('button');

// ✅ Good: Caching selectors
const buttonSelector = generateSEQL(document.querySelector('button'));
// Later...
const button = resolveSEQL(buttonSelector!, document)[0];
```

## Comparison with EID/Core API

| Feature     | SEQL Functions         | EID/Core Functions                  |
| ----------- | ---------------------- | ----------------------------------- |
| Return type | `string` / `Element[]` | `ElementIdentity` / `ResolveResult` |
| Simplicity  | ⭐⭐⭐⭐⭐ Simple      | ⭐⭐⭐ Advanced                     |
| Size        | ~100-300 bytes         | ~500-2000 bytes                     |
| Metadata    | None                   | Full details                        |
| Status info | No                     | Yes (4 statuses)                    |
| Confidence  | No                     | Yes (0-1 score)                     |
| Warnings    | No                     | Yes                                 |
| Use case    | Analytics, storage     | Debugging, advanced                 |

## Next Steps

- [Core Functions](./core-functions.md) - Low-level EID/Core API
- [Batch API](./batch-api.md) - Process multiple elements
- [Cache API](./cache-api.md) - Performance optimization
- [Examples](../examples/) - Real-world patterns
