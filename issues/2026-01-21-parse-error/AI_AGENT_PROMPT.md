# AI Agent Prompt: Fix SEQL Parser Component Order

## Context

You are working on the `seql-js` library, a semantic element query language for stable DOM element identification. The library has two critical functions:
- `stringifySEQL()` - converts EID to SEQL string
- `parseSEQL()` - parses SEQL string back to EID

**Problem:** There is a component order mismatch causing parser to fail.

## Current State

**File:** `/src/utils/seql-parser.ts`

**Generator (`stringifyNode`)** produces: `tag[attrs].class#pos`  
**Parser (`parseNode`)** expects: `tag.class[attrs]#pos`

**Error:**
```
Invalid node: unexpected content ".glass-card#2" in "form[data-seql-id="seql-el-17"].glass-card#2"
```

## Task

Fix the `stringifyNode` function in `/src/utils/seql-parser.ts` to generate components in the correct order that matches the parser.

## Required Changes

In the `stringifyNode` function (approximately lines 221-339):

**Current order:**
1. Prepare attributes list
2. Add attributes to result: `result += [...]`
3. Add classes to result: `result += .class`
4. Add position to result: `result += #N`

**Required order:**
1. Prepare attributes list (keep preparation logic)
2. Add classes to result: `result += .class`
3. Add attributes to result: `result += [...]`
4. Add position to result: `result += #N`

## Specific Instructions

1. **Locate the function `stringifyNode`** around line 221
2. **Find the block that adds attributes** (lines ~298-304):
   ```typescript
   if (finalAttrs.length > 0) {
     finalAttrs.sort((a, b) => a.localeCompare(b));
     result += `[${finalAttrs.join(',')}]`;
   }
   ```
3. **Find the block that adds classes** (lines ~306-320):
   ```typescript
   if (semantics.classes && semantics.classes.length > 0) {
     const stableClasses = filterStableClasses(semantics.classes);
     // ... filter logic ...
     result += limitedClasses.map(c => `.${c}`).join('');
   }
   ```
4. **Move the classes block BEFORE the attributes block**
5. **Keep all the filtering and simplification logic intact**
6. **The preparation of `finalAttrs` must happen BEFORE the classes block, but the actual addition `result += [...]` must happen AFTER**

## Code Structure After Fix

```typescript
function stringifyNode(...): string {
  const { tag, semantics } = node;
  let result = tag;

  // 1. Prepare attributes (all the filtering logic stays here)
  const attrStrings: string[] = [];
  // ... attribute preparation code (lines 226-291) ...
  
  let finalAttrs = attrStrings;
  if (isTarget && options.simplifyTarget && semantics.id) {
    finalAttrs = attrStrings.filter(/* ... */);
  }
  if (finalAttrs.length > 0) {
    finalAttrs.sort((a, b) => a.localeCompare(b));
  }

  // 2. Add classes FIRST (MOVE THIS UP)
  if (semantics.classes && semantics.classes.length > 0) {
    // ... existing class logic ...
    result += limitedClasses.map(c => `.${c}`).join('');
  }

  // 3. Add attributes SECOND (MOVE THIS DOWN)
  if (finalAttrs.length > 0) {
    result += `[${finalAttrs.join(',')}]`;
  }

  // 4. Add position LAST (keep as is)
  if ('nthChild' in node && node.nthChild) {
    // ... existing position logic ...
    result += `#${node.nthChild}`;
  }

  return result;
}
```

## Validation

After making changes:

1. Build the project: `npm run build` or `yarn build`
2. Load the test suite in browser at https://appsurify.github.io/modern-seaside-stay/
3. Run: `window.testSeqlJs()`
4. Verify:
   - ✅ SEQL string matches pattern: `tag.class[attrs]#pos`
   - ✅ No parser errors
   - ✅ Round-trip (EID → SEQL → EID) works

## Expected Output

**Before Fix:**
```
v1.0: form[data-seql-id="seql-el-17"].glass-card#2 :: button[...]
      ↑ WRONG ORDER: [attrs].class
```

**After Fix:**
```
v1.0: form.glass-card[data-seql-id="seql-el-17"]#2 :: button[...]
      ↑ CORRECT ORDER: .class[attrs]
```

## Important Notes

- Do NOT change the attribute preparation logic (filtering, sorting, etc.)
- Do NOT change the class filtering logic
- Do NOT change the position logic
- ONLY change the ORDER in which these components are appended to `result`
- Keep all variable names and logic identical
- This is a simple refactoring of code order, not a rewrite

## Files to Modify

- `/src/utils/seql-parser.ts` - stringifyNode function only

## Reference Issue

See `/issues/2026-01-21-parse-error/ISSUE.md` for detailed analysis
