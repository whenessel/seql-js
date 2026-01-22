# Resolution Algorithm

5-phase algorithm for resolving EIDs back to DOM elements.

## Algorithm Overview

```
Phase 1: CSS Narrowing      → Candidates (100-1000 elements)
Phase 2: Semantic Filtering  → Filtered (10-50 elements)
Phase 3: Uniqueness Check    → Early exit if 1 match
Phase 4: Constraints        → Final candidates (0-N elements)
Phase 5: Handle Ambiguity    → ResolveResult
```

## Detailed Phases

### Phase 1: CSS Narrowing
Build CSS selector and query DOM.

```typescript
const selector = cssGenerator.buildSelector(eid);
// "form button[type='submit']"

const candidates = root.querySelectorAll(selector);
// [<button>, <button>, <button>]
```

### Phase 2: Semantic Filtering
Score candidates by semantic similarity.

```typescript
const scored = candidates.map(el => ({
  element: el,
  score: calculateSemanticScore(el, eid.target.semantics)
}));

const filtered = scored
  .filter(s => s.score > 0.5)
  .sort((a, b) => b.score - a.score)
  .map(s => s.element);
```

### Phase 3: Uniqueness Check
Early exit for single match.

```typescript
if (filtered.length === 1) {
  return {
    status: 'success',
    elements: filtered,
    confidence: eid.meta.confidence
  };
}
```

### Phase 4: Constraints Evaluation
Apply disambiguation rules.

```typescript
let final = filtered;

for (const constraint of eid.constraints || []) {
  final = constraintsEvaluator.evaluate(final, constraint);
}
```

### Phase 5: Handle Ambiguity
Return appropriate result.

```typescript
if (final.length === 0 && options.enableFallback) {
  return fallbackHandler.handleFallback(eid, root);
}

if (final.length > 1) {
  return { status: 'ambiguous', elements: final };
}

if (final.length === 0) {
  return { status: 'error', elements: [] };
}

return { status: 'success', elements: final };
```

## Performance Characteristics

| Phase | Complexity | Typical Time |
|-------|-----------|--------------|
| 1 | O(n) | 5ms |
| 2 | O(m log m) | 8ms |
| 3 | O(1) | <1ms |
| 4 | O(m × c) | 3ms |
| 5 | O(m) | 2ms |

Where:
- n = DOM size
- m = candidate count
- c = constraint count
