# Development Guidelines for seql-js

This document provides essential information for developers working on the `seql-js` project.

## 1. Build and Configuration

### Environment Requirements

- **Node.js**: v18+ recommended.
- **Package Manager**: Yarn (v1.22.22).

### Core Commands

- `yarn install`: Install dependencies.
- `yarn build`: Build the library (outputs to `dist/`).
- `yarn build:watch`: Run build in watch mode.
- `yarn types:check`: Run TypeScript type checking.

### Project Structure

- `src/generator/`: Logic for converting DOM elements into EID (Element Identity Descriptor) JSON.
- `src/resolver/`: Logic for resolving EID JSON back to DOM elements.
- `src/types/`: Core type definitions for EIDs, Semantics, and Constraints.
- `src/utils/`: Shared utilities, constants, and scoring algorithms.

---

## 2. Testing Information

### Configuration

- **Test Runner**: [Vitest](https://vitest.dev/).
- **Environment**: [jsdom](https://github.com/jsdom/jsdom) for DOM emulation.
- **Configuration File**: `vitest.config.ts`.

### Running Tests

- `yarn test`: Run all tests once.
- `yarn test:watch`: Run tests in watch mode.
- `yarn test:coverage`: Run tests with coverage report.
- `npx vitest tests/path/to/test.ts`: Run a specific test file.

### Adding New Tests

- Place tests in the `tests/` directory.
- Use the `.test.ts` extension.
- Prefer integration tests for main flows (`generator` and `resolver`).
- Always mock or create a DOM structure using `document.body.innerHTML` or `document.createElement` since tests run in `jsdom`.

### Demonstration Test

The following test demonstrates how to use the library to generate an EID and resolve it back to the original element.

```typescript
import { describe, it, expect } from 'vitest';
import { generateEID, resolve } from '../src';

describe('Development Guideline Example', () => {
  it('should generate and resolve an EID for a simple element', () => {
    // 1. Setup a simple DOM structure
    document.body.innerHTML = `
      <div id="app">
        <form id="login-form">
          <button type="submit" class="primary-btn">Login</button>
        </form>
      </div>
    `;

    const button = document.querySelector('button.primary-btn') as HTMLElement;

    // 2. Generate EID (DOM -> JSON)
    const eid = generateEID(button);
    expect(eid).not.toBeNull();
    expect(eid?.target.tag).toBe('button');
    expect(eid?.anchor.tag).toBe('form');

    // 3. Resolve EID (JSON -> DOM)
    // resolve() returns a ResolveResult object containing an 'elements' array
    const result = resolve(eid!, document);
    expect(result.status).toBe('success');
    expect(result.elements[0]).toBe(button);
  });
});
```

---

## 3. Additional Development Information

### Code Style

- **TypeScript**: Strictly enforced. Use `yarn types:check` to verify.
- **Naming**: Follow existing camelCase for variables/functions and PascalCase for classes/types.
- **Documentation**: Use JSDoc for public APIs. Reference specific sections of `SPECIFICATION.md` when implementing core algorithms.

### Critical Design Principles

1. **Determinism**: EID generation must be deterministic. Avoid timestamps or random values in the EID JSON.
2. **Semantic-First**: Prioritize ARIA roles, labels, and semantic HTML tags (`<main>`, `<nav>`, etc.) over structural position (`nth-child`).
3. **Stability**: The EID is designed to survive DOM changes. Prefer attributes that are likely to remain stable across UI updates.

### Authoritative Reference

Always refer to `docs/specs/SPECIFICATION.md` (Russian) for the formal definition of the EID system. Any changes to the core generation or resolution logic **must** align with this specification.

### Common Tasks

- **Updating Scoring**: Weights and scoring constants are located in `src/utils/constants.ts` and `src/utils/scorer.ts`.
- **Adding Semantic Extractors**: Modify `src/generator/semantic-extractor.ts` and update the `ElementSemantics` type in `src/types/semantics.ts`.
- **Caching**: The library uses an internal LRU cache. Use `getGlobalCache()` from `src/utils/eid-cache.ts` to manage or reset it.
