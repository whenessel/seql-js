# Plan: Fix ESLint Warnings in seql-parser.ts

## Overview

Fix 4 ESLint warnings in [src/utils/seql-parser.ts](src/utils/seql-parser.ts):

1. Line 13: Unused import `IGNORED_ATTRIBUTES`
2. Lines 509, 514: `any` type usage
3. Line 685: `console.error` statement

## Current State

### Warning 1: Unused `IGNORED_ATTRIBUTES` (line 13)

- **Import**: `IGNORED_ATTRIBUTES` from `./constants`
- **Problem**: Imported but never used in the file
- **Current code** (line 263): Has hardcoded array `['style', 'xmlns', 'tabindex', 'contenteditable']`
- **Note**: `IGNORED_ATTRIBUTES` is used in other files (semantic-extractor.ts, css-generator.ts)

### Warning 2-3: `any` type usage (lines 509, 514)

- **Function**: `parseConstraints(constraintsStr: string): any[]`
- **Problem**: Returns `any[]` and uses `const constraints: any[] = []`
- **Available type**: `Constraint` interface from `types/constraints.ts`

### Warning 4: Console statement (line 685)

- **Function**: `resolveSEQL()` - facade function that catches errors
- **Context**: This is a user-facing API function that handles parsing/resolution errors gracefully
- **Current behavior**: Logs error and returns empty array

## Implementation Plan

### 1. Fix Unused Import (line 13)

**Option A** (Recommended): Use `IGNORED_ATTRIBUTES` constant instead of hardcoded array

- Replace hardcoded array on line 263 with `IGNORED_ATTRIBUTES`
- Adjust filtering logic since `IGNORED_ATTRIBUTES` includes 'id' and 'class' (which are handled separately)
- Filter: `attr.name !== 'id' && attr.name !== 'class' && !IGNORED_ATTRIBUTES.has(attr.name)`

**Option B**: Remove unused import

- Remove `IGNORED_ATTRIBUTES` from line 13
- Keep hardcoded array

**Decision**: Use Option A - eliminates code duplication and maintains consistency with other modules

### 2. Fix `any` Type Usage (lines 509, 514)

Replace `any[]` with proper type `Constraint[]`:

```typescript
function parseConstraints(constraintsStr: string): Constraint[] {
  if (!constraintsStr.trim()) {
    return [];
  }

  const constraints: Constraint[] = [];
  // ... rest of function
}
```

Add import for `Constraint` type from `types/constraints.ts`:

```typescript
import type { Constraint } from '../types/constraints';
```

### 3. Fix Console Statement (line 685)

**Option A**: Suppress warning with eslint-disable comment (least invasive)

```typescript
// eslint-disable-next-line no-console
console.error('Failed to resolve SEQL Selector:', error);
```

**Option B**: Remove console.error (silent failure)

```typescript
// Silently return empty array on parse/resolution error
return [];
```

**Decision**: Use Option A - preserves debugging capability while acknowledging intentional console usage. This is a facade function where console.error is appropriate for user-facing error reporting.

## Files to Modify

1. **[src/utils/seql-parser.ts](src/utils/seql-parser.ts)**
   - Line 1: Add `Constraint` import
   - Line 263: Replace hardcoded array with `IGNORED_ATTRIBUTES` check
   - Line 509: Change return type from `any[]` to `Constraint[]`
   - Line 514: Change variable type from `any[]` to `Constraint[]`
   - Line 685: Add eslint-disable comment

## Verification (REQUIRED)

All checks must pass before considering the task complete.

### 1. Type Checking (REQUIRED)

Verify TypeScript compilation passes:

```bash
yarn types:check
```

**Expected**: No type errors

**Validation**: `Constraint[]` type is compatible with all usage sites

### 2. Linting (REQUIRED)

Run ESLint on the modified file:

```bash
yarn lint:check
```

**Expected**: 0 warnings in seql-parser.ts

**Focus**: All 4 original warnings must be resolved

### 3. Code Formatting (REQUIRED)

Verify Prettier formatting compliance:

```bash
yarn format:check
```

**Expected**: No formatting violations

**Action**: If violations found, run `yarn format:fix`

### 4. Build (REQUIRED)

Verify project builds successfully:

```bash
yarn build
```

**Expected**:

- Clean build with no errors
- Output files generated in `dist/`:
  - `dist/seql-js.js` (ESM)
  - `dist/seql-js.umd.cjs` (UMD)
  - `dist/seql-js.d.ts` (TypeScript declarations)

### 5. Tests (REQUIRED)

Run full test suite:

```bash
yarn test
```

**Expected**: All tests pass without changes

**Note**: No test modifications needed - changes are type annotations and refactoring only

### 6. Runtime Behavior Verification

Confirm no behavioral changes:

- `parseConstraints()` works identically (constraints already match `Constraint` interface structure)
- `stringifyNode()` filtering works identically (logic adjusted for Set lookup instead of array includes)
- `resolveSEQL()` error handling unchanged (only adds eslint comment)

### Complete Verification Sequence

```bash
# Run all checks in order
yarn types:check && \
yarn lint:check && \
yarn format:check && \
yarn build && \
yarn test
```

All commands must succeed (exit code 0) for verification to pass.

## Risk Assessment

**Low Risk** - All changes are:

- Type annotations (no runtime change)
- Refactoring hardcoded constant to use shared constant (same values)
- Adding eslint suppression comment (no code change)

No breaking changes or behavioral modifications.
