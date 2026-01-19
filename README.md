# seql-js

Semantic Element Query Language - Stable DOM element identification for web analytics and session replay.

## Features

- **Semantic-first**: Uses ARIA, roles, semantic HTML instead of brittle selectors
- **Stable across changes**: Survives DOM restructuring and CSS changes
- **Dual format**: Structured EID (internal) + String EIQ (transport) ✅
- **Zero dependencies**: Tree-shakeable, works in browser and Node.js
- **TypeScript native**: Full type definitions included

## Installation

```bash
npm install seql-js
# or
yarn add seql-js
```

## Quick Start

### Option 1: EIQ String Format (Recommended for Analytics)

```typescript
import { generateEIQ, resolveEIQ } from 'seql-js';

// Generate EIQ string from DOM element
const button = document.querySelector('.submit-button');
const eiq = generateEIQ(button);
// "v1: form[#checkout] :: div.actions > button.submit"

// Send to analytics
gtag('event', 'click', { element_identity: eiq });

// Later: resolve EIQ string back to element
const elements = resolveEIQ(eiq, document);
// [<button class="submit-button">Complete Order</button>]
```

### Option 2: EID Structured Format (For Internal Operations)

```typescript
import { generateEID, resolve } from 'seql-js';

// Generate Element Identity Descriptor (JSON)
const button = document.querySelector('.submit-button');
const eid = generateEID(button);

// Resolve EID back to element
const elements = resolve(eid, document);
// [<button class="submit-button">Complete Order</button>]
```

## Concepts

### EID vs EIQ

- **EID** (Element Identity Descriptor): Structured JSON format for internal operations
- **EIQ** (Element Identity Query): Canonical string format for transport and storage

```
String Format (EIQ):
  Element → generateEIQ() → "v1: form :: button.submit"
  "v1: form :: button.submit" → resolveEIQ() → Element[]

Structured Format (EID):
  Element → generateEID() → EID (JSON)
  EID (JSON) → resolve() → Element[]

Conversion:
  EID → stringifyEID() → EIQ string
  EIQ string → parseEIQ() → EID
```

### Architecture

EID describes **what** an element is semantically:
- **Anchor**: Semantic root (e.g., `<form>`, `<main>`, ARIA landmarks)
- **Path**: Semantic traversal from anchor to target
- **Target**: The element being identified
- **Constraints**: Disambiguation rules (uniqueness, visibility, etc.)

## API

### EIQ String Functions (Recommended for Analytics)

#### `generateEIQ(element, options?)`

Generate EIQ string directly from DOM element. Combines `generateEID()` + `stringifyEID()`.

```typescript
import { generateEIQ } from 'seql-js';

const button = document.querySelector('.submit');
const eiq = generateEIQ(button);
// "v1: form :: div > button.submit"

// Use in analytics
gtag('event', 'click', { element_identity: eiq });
```

#### `resolveEIQ(eiq, dom, options?)`

Resolve EIQ string directly to DOM elements. Combines `parseEIQ()` + `resolve()`.

```typescript
import { resolveEIQ } from 'seql-js';

const eiq = "v1: form :: button.submit";
const elements = resolveEIQ(eiq, document);
```

#### `parseEIQ(eiq)`

Parse EIQ string to EID structure.

```typescript
import { parseEIQ } from 'seql-js';

const eiq = "v1: form :: button.submit";
const eid = parseEIQ(eiq);
// Returns ElementIdentity (JSON structure)
```

#### `stringifyEID(eid)`

Convert EID structure to canonical EIQ string.

```typescript
import { stringifyEID, generateEID } from 'seql-js';

const eid = generateEID(element);
const eiq = stringifyEID(eid);
// "v1: form :: button.submit"
```

### Core EID Functions

#### `generateEID(element, options?)`

Generate Element Identity Descriptor from a DOM element.

```typescript
import { generateEID } from 'seql-js';

const button = document.querySelector('.submit');
const eid = generateEID(button);
```

**Options:**
- `maxPathDepth`: Maximum path depth (default: 10)
- `enableSvgFingerprint`: Enable SVG fingerprinting (default: true)
- `confidenceThreshold`: Minimum confidence threshold (default: 0.1)
- `fallbackToBody`: Use body as fallback anchor (default: true)
- `cache`: Optional EIDCache instance

#### `resolve(eid, dom, options?)`

Resolve EID to DOM elements.

```typescript
import { resolve } from 'seql-js';

const elements = resolve(eid, document);
```

**Options:**
- `strictMode`: Strict matching mode (default: false)
- `enableFallback`: Enable fallback resolution (default: true)
- `maxCandidates`: Maximum candidates to evaluate (default: 20)

### Cache

```typescript
import { createEIDCache, getGlobalCache } from 'seql-js';

// Create custom cache
const cache = createEIDCache({ maxSelectorCacheSize: 500 });

// Use global cache
const globalCache = getGlobalCache();
```

### Batch Operations

```typescript
import { generateEIDBatch } from 'seql-js';

const buttons = document.querySelectorAll('button');
const result = generateEIDBatch(Array.from(buttons));

console.log(`Generated ${result.successful.length} EIDs`);
console.log(`Failed: ${result.failed.length}`);
```

## Documentation

- [Architecture](docs/specs/ARCHITECTURE.md)
- [Developer Guide](CLAUDE.md)
- [Specifications](docs/specs/SPECIFICATION.md) _(Russian)_

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Run tests
yarn test

# Type check
yarn types:check
```

## Migrating from v0.x

If you're upgrading from v0.x, note these breaking changes:

- `generateDsl()` → `generateEID()`
- `resolveDsl()` → `resolve()`
- `DslIdentity` → `ElementIdentity`
- `DslCache` → `EIDCache`
- `validateDsl()` → `validateEID()`

See full migration guide in [docs/MIGRATION.md](docs/MIGRATION.md).

## License

MIT
