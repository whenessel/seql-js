# Resolution: firstName Selector Generation Fix

## What Was Fixed

Fixed two independent bugs that caused incorrect selector generation for form inputs with camelCase IDs and Tailwind utility classes.

### Fix 1: Refined ID Validation Pattern

**File:** `src/utils/id-validator.ts:29-40`

**Before:**

```typescript
if (/^[a-z]{1,3}[A-Za-z0-9]{8,}$/.test(id) && (/\d/.test(id) || /[A-Z]/.test(id))) {
  return true;
}
```

**After:**

```typescript
if (/^[a-z]{1,3}[A-Za-z0-9]{8,}$/.test(id)) {
  const hasDigits = /\d/.test(id);
  const hasUppercase = /[A-Z]/.test(id);
  const isVeryLong = id.length >= 20;

  if ((hasDigits && hasUppercase) || isVeryLong) {
    return true;
  }
}
```

**Change:**

- Require BOTH digits AND uppercase for shorter hash-like IDs (9-19 chars)
- OR require 20+ characters for very long hash sequences
- CamelCase IDs like "firstName" (uppercase but no digits) are now stable
- True hashes like "scBdVaJa1" (both uppercase and digits) still detected as dynamic
- Very long hashes like "abc123def456..." (20+ chars) still detected as dynamic

### Fix 2: Added Catch-All Pattern for Arbitrary Pseudo-Class Variants

**File:** `src/utils/class-classifier.ts:72-76`

**Added pattern:**

```typescript
// === Arbitrary pseudo-class/modifier variants (catch-all) ===
// Matches any lowercase/hyphenated prefix followed by colon
// e.g., file:bg-transparent, placeholder:text-gray, invalid:border-red, accept:text-primary
// Must come AFTER semantic pattern checks to avoid false positives
/^[a-z][a-z-]*:/,
```

**Rationale:**

- Tailwind CSS and modern frameworks support arbitrary variants with `:` syntax
- Classes with `:` separator are always utility/modifier classes, never semantic
- Pattern catches all variants: `file:`, `placeholder:`, `invalid:`, `accept:`, etc.

## Files Created/Modified

### Modified

- `src/utils/id-validator.ts` - Refined hash-like ID detection pattern
- `src/utils/class-classifier.ts` - Added catch-all pattern for arbitrary pseudo-class variants

### Test Files Modified

- `tests/unit/id-validator.test.ts` - Added tests for camelCase IDs and edge cases
- `tests/unit/class-classifier.test.ts` - Added tests for arbitrary pseudo-class variants

### Test Files Created

- `tests/integration/firstname-selector-fix.test.ts` - Comprehensive integration tests for both fixes

## Verification Criteria

✅ All 1134 existing tests pass (no regressions)
✅ `isDynamicId('firstName')` returns `false` (was incorrectly `true`)
✅ `isDynamicId('lastName')` returns `false` (already worked)
✅ `isUtilityClass('file:bg-transparent')` returns `true` (was incorrectly `false`)
✅ Semantic extractor includes `id: "firstName"` in semantics
✅ Semantic extractor filters out all `file:*`, `placeholder:*`, etc. classes
✅ Generated EID for firstName input includes stable ID
✅ Edge cases handled:

- CamelCase IDs without digits: stable
- Hash-like IDs with both digits and uppercase: dynamic
- Very long random sequences (20+ chars): dynamic

## Integration Points

- **ID validation:** Used by `semantic-extractor.ts` to filter IDs
- **Class filtering:** Used by `class-filter.ts` and `semantic-extractor.ts` to filter utility classes
- No breaking changes to public API
- Backward compatible with existing EID generation
