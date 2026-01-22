# Installation

## Package Manager Installation

### Using Yarn (Recommended)

```bash
yarn add @whenessel/seql-js
```

### Using npm

```bash
npm install @whenessel/seql-js
```

### Using pnpm

```bash
pnpm add @whenessel/seql-js
```

## Requirements

- **Node.js**: v18.0.0 or higher
- **Package Manager**: Yarn, npm, or pnpm
- **Browser**: Modern browsers supporting ES2015+

## Importing the Library

### ES Modules (Recommended)

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';
```

### CommonJS

```javascript
const { generateSEQL, resolveSEQL } = require('seql-js');
```

### TypeScript

SEQL is written in TypeScript and includes full type definitions out of the box. No additional `@types` package is needed.

```typescript
import {
  generateSEQL,
  resolveSEQL,
  generateEID,
  resolve,
  type ElementIdentity,
  type ResolveResult,
  type GeneratorOptions
} from 'seql-js';
```

## Build Output

The package includes multiple build formats:

- **ESM**: `dist/seql-js.js` - Modern ES modules
- **UMD**: `dist/seql-js.umd.cjs` - Universal module for legacy systems
- **Types**: `dist/seql-js.d.ts`, `dist/seql-js.d.cts` - TypeScript definitions

Your bundler (Webpack, Vite, Rollup, etc.) will automatically select the appropriate format.

## Browser Usage (CDN)

For quick prototyping or non-bundled projects, you can use a CDN:

### Using unpkg

```html
<script type="module">
  import { generateSEQL } from 'https://unpkg.com/@whenessel/seql-js@1.1.0/dist/seql-js.js';

  const selector = generateSEQL(document.querySelector('button'));
  console.log(selector);
</script>
```

### Using jsDelivr

```html
<script type="module">
  import { generateSEQL } from 'https://cdn.jsdelivr.net/npm/@whenessel/seql-js@1.1.0/dist/seql-js.js';

  const selector = generateSEQL(document.querySelector('button'));
  console.log(selector);
</script>
```

## Verifying Installation

After installation, verify everything works:

```typescript
import { generateSEQL } from 'seql-js';

// Create a simple test element
const testElement = document.createElement('button');
testElement.textContent = 'Test Button';
testElement.type = 'button';
document.body.appendChild(testElement);

// Generate a selector
const selector = generateSEQL(testElement);
console.log('SEQL Selector:', selector);

// Clean up
document.body.removeChild(testElement);
```

You should see output like:
```
SEQL Selector: v1: button[type="button",text="Test Button"]
```

## Tree Shaking

SEQL is designed to be tree-shakeable. Import only what you need:

```typescript
// Import only SEQL string functions (smaller bundle)
import { generateSEQL, resolveSEQL } from 'seql-js';

// Import EID functions as well (larger bundle)
import { generateEID, resolve, generateSEQL, resolveSEQL } from 'seql-js';
```

## Dependencies

**Zero runtime dependencies.** SEQL is a standalone library with no external dependencies, keeping your bundle size small.

## Next Steps

- [Basic Usage](./basic-usage.md) - Learn common patterns
- [Concepts](./concepts.md) - Understand the identity model
- [API Reference](../api/) - Explore the complete API
