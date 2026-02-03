# Issue: firstName Selector Generation

## Summary

Selector for `<input id="firstName">` was incorrectly generated due to two independent bugs:

1. ID validation incorrectly marked camelCase IDs like "firstName" as dynamic
2. Utility class filtering missed arbitrary pseudo-class variants like `file:bg-transparent`

## Reproduction

```html
<form id="testForm">
  <div class="glass-card">
    <input
      id="firstName"
      name="firstName"
      class="flex h-10 w-full file:border-0 file:bg-transparent"
    />
  </div>
</form>
```

**Observed behavior:**

- `id="firstName"` not included in semantics
- Utility classes `file:border-0` and `file:bg-transparent` included in selector
- Generated selector: `form#2 :: div.glass-card#1 > input.file:bg-transparent.file:border-0[name="firstName"]#2`

**Expected behavior:**

- `id="firstName"` included in semantics
- Utility classes filtered out
- Generated selector similar to: `form :: div.glass-card > input[id="firstName",name="firstName"]`

## Context

### Issue 1: ID Validation Bug

**Location:** `src/utils/id-validator.ts:29-33`

The hash-like ID pattern `(/^[a-z]{1,3}[A-Za-z0-9]{8,}$/.test(id) && (/\d/.test(id) || /[A-Z]/.test(id)))` incorrectly flagged camelCase IDs as dynamic:

- **"firstName"**: `f` (1 letter) + `irstName` (8 chars with uppercase N) → matched pattern → marked as dynamic ❌
- **"lastName"**: `l` (1 letter) + `astName` (7 chars) → too short → not matched → marked as stable ✓

**Root cause:** Pattern used `||` (OR) logic, matching IDs with EITHER digits OR uppercase. CamelCase IDs naturally contain uppercase but are semantic, not dynamic.

### Issue 2: Utility Class Filtering Bug

**Location:** `src/utils/class-classifier.ts:53-161`

The `UTILITY_CLASS_PATTERNS` only checked known pseudo-class prefixes (`hover:`, `focus:`, `sm:`, etc.) but missed arbitrary variants like `file:`, `placeholder:`, `accept:`.

## Impact

- Medium severity: Affects form inputs with camelCase IDs
- Generates incorrect selectors with utility classes
- Reduces selector stability and semantic value
- Affects projects using Tailwind CSS with arbitrary variants

## Analysis

Both bugs are independent:

1. **ID validation:** The pattern intent was to catch CSS-in-JS hashes (e.g., `scBdVaJa1`) but also caught semantic camelCase IDs
2. **Class filtering:** Missing catch-all pattern for arbitrary Tailwind pseudo-class variants

The combination of both bugs caused the observed issue where:

- `id` was missing from semantics (bug 1)
- Utility classes appeared in selector (bug 2)
