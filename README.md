# seql-js

Semantic Element Query Language (SEQL) - Stable DOM element identification for web analytics, session replay, and automation.

`seql-js` provides a robust way to identify DOM elements using semantic features rather than brittle CSS paths or XPath. It's designed to survive DOM restructuring, CSS changes, and framework updates.

## Features

- **Semantic-first**: Uses ARIA roles, labels, semantic HTML tags, and stable attributes.
- **Resilient**: Designed to be stable across UI updates and DOM changes.
- **State-independent** (v1.0.3): Filters out state attributes (`aria-selected`, `data-state`, `disabled`) to ensure elements are found regardless of their current state.
- **Dual Format**:
  - **EID** (JSON): Structured descriptor for internal operations and high precision.
  - **SEQL Selector** (String): Canonical string format for easy transport (analytics) and storage.
- **Deterministic**: Guaranteed same output for the same DOM state.
- **Zero Dependencies**: Tree-shakeable and lightweight.
- **TypeScript Native**: Written in TypeScript with full type definitions.

## Requirements

- **Node.js**: v18 or higher.
- **Package Manager**: Yarn (recommended) or npm.

## Installation

```bash
yarn add seql-js
# or
npm install seql-js
```

## Quick Start

### 1. SEQL Selector Format (Recommended for Analytics)

SEQL Selectors are compact, URL-safe strings perfect for sending to analytics platforms.

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// 1. Generate SEQL Selector from a DOM element
const button = document.querySelector('.submit-button');
const selector = generateSEQL(button);
// Result: "v1: form :: div.actions > button[type="submit",text="Order Now"]"

// 2. Send to your analytics provider
gtag('event', 'click', { element_selector: selector });

// 3. Later: Resolve SEQL Selector back to the original element
const elements = resolveSEQL(selector, document);
// Returns an array: [<button>...]
```

### 2. EID Structured Format (Internal Operations)

EID is a rich JSON object containing full semantic metadata and resolution constraints.

```typescript
import { generateEID, resolve } from 'seql-js';

// 1. Generate EID (JSON)
const button = document.querySelector('.submit-button');
const eid = generateEID(button);

// 2. Resolve EID
const result = resolve(eid, document);

if (result.status === 'success') {
  console.log('Found element:', result.elements[0]);
  console.log('Confidence score:', result.confidence);
}
```

## Concepts

### EID vs SEQL Selector

- **EID** (Element Identity Descriptor): A detailed JSON structure describing the **Anchor**, **Path**, **Target**, and **Constraints**.
- **SEQL Selector**: A canonical string representation of an EID, similar to CSS Selector or XPath.

```text
Generation: Element → generateEID() → EID (JSON)
Stringify:  EID → stringifySEQL() → SEQL Selector (string)
Parse:      SEQL Selector → parseSEQL() → EID (JSON)
Resolution: EID → resolve() → ResolveResult
```

### Core Architecture

1. **Anchor**: A semantic root (e.g., `<form>`, `<main>`, or ARIA landmarks).
2. **Path**: Semantic traversal from the anchor to the target.
3. **Target**: The specific element being identified.
4. **Constraints**: Disambiguation rules (uniqueness, visibility, text proximity).

## API Reference

### SEQL Selector Functions

#### `generateSEQL(element, generatorOptions?, stringifyOptions?)`

Convenience function: `generateEID` + `stringifySEQL`. Returns a string or `null`.

#### `resolveSEQL(selector, root, options?)`

Convenience function: `parseSEQL` + `resolve`. Returns `Element[]`.

#### `parseSEQL(selector)`

Parses a SEQL Selector into an `ElementIdentity` object.

#### `stringifySEQL(eid, options?)`

Converts an `ElementIdentity` object into a canonical SEQL Selector.

### Core Functions

#### `generateEID(element, options?)`

Generates an `ElementIdentity` (EID) from a DOM element.

- `maxPathDepth`: Default 10.
- `enableSvgFingerprint`: Default true.
- `confidenceThreshold`: Default 0.1.

#### `resolve(eid, root, options?)`

Resolves an EID back to DOM element(s). Returns a `ResolveResult` object.

- `status`: `'success' | 'ambiguous' | 'error' | 'degraded-fallback'`.
- `elements`: `Element[]` of matches.
- `confidence`: Match confidence score (0-1).

### Utilities & Advanced

#### `generateEIDBatch(elements, options?)`

Optimized generation for multiple elements at once.

#### `createEIDCache(options?)` / `getGlobalCache()`

Manage the LRU cache to improve performance for frequent generations/resolutions.

## Project Structure

- `src/generator/`: Logic for converting DOM elements into EID JSON.
- `src/resolver/`: Logic for resolving EID JSON back to DOM elements.
- `src/types/`: Core type definitions for EIDs, Semantics, and Constraints.
- `src/utils/`: Shared utilities, constants, and scoring algorithms.
- `extensions/chrome/`: Chrome DevTools extension for visual SEQL inspection.

## Developer Tools

### Chrome DevTools Extension

The SEQL Inspector extension provides visual tooling for working with SEQL selectors directly in Chrome DevTools.

**Features:**

- Generate SEQL selectors for all elements or pick individual elements
- Full iframe support with automatic detection and context switching
- Live search and resolution testing
- Interactive element highlighting and inspection
- Tree view with grouping and filtering

**Installation:**

```bash
yarn extension:prepare
# Then load extensions/chrome/ as unpacked extension in Chrome
```

See [Chrome Extension README](extensions/chrome/README.md) for detailed documentation.

## Scripts

- `yarn build`: Build the library (outputs to `dist/`).
- `yarn test`: Run all tests using Vitest.
- `yarn test:watch`: Run tests in watch mode.
- `yarn test:coverage`: Run tests with coverage report.
- `yarn types:check`: Run TypeScript type checking.
- `yarn extension:prepare`: Build library and prepare Chrome extension.
- `npx vitest <path>`: Run a specific test file.

## Documentation

- **[Getting Started](docs/getting-started/)** - Installation and quick start guide
- **[API Reference](docs/api/)** - Complete API documentation
- **[Examples](docs/examples/)** - Practical code examples
- **[Specification](docs/specification/)** - EID and SEQL format specifications
- **[Architecture](docs/architecture/)** - System design and internals
- **[Guides](docs/guides/)** - Advanced topics and patterns
- **[Contributing](docs/contributing/)** - Development guide
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions
- **[CLAUDE.md](CLAUDE.md)** - AI agent development guidelines

## Migrating from v0.x

If you are upgrading from v0.x, note these breaking changes:

- `generateDsl()` → `generateEID()`
- `resolveDsl()` → `resolve()`
- `DslIdentity` → `ElementIdentity`
- `DslCache` → `EIDCache`
- `validateDsl()` → `validateEID()`

See the full [Migration Guide](docs/MIGRATION.md) for details.

## License

MIT
