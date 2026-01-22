# Testing Guide

Running and writing tests for seql-js.

## Running Tests

```bash
# All tests
yarn test

# Watch mode
yarn test:watch

# Specific file
npx vitest run tests/generator.test.ts

# With coverage
yarn test:coverage
```

## Test Structure

Tests use Vitest with jsdom for DOM emulation.

```typescript
import { describe, it, expect } from 'vitest';
import { generateEID } from '../src';

describe('generateEID', () => {
  it('should generate EID for button', () => {
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Submit';
    document.body.appendChild(button);

    const eid = generateEID(button);

    expect(eid).not.toBeNull();
    expect(eid?.target.tag).toBe('button');
  });
});
```

## Writing Tests

1. Create DOM elements
2. Call function
3. Assert results
4. Clean up (if needed)

## Test Categories

- `generator.test.ts` - Generation tests
- `resolver.test.ts` - Resolution tests
- `css-generator.test.ts` - CSS selector tests
- `utils.test.ts` - Utility function tests
