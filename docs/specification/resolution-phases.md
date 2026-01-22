# Resolution Algorithm: 5 Phases

The resolution algorithm converts an EID back to DOM elements in 5 phases.

## Phase 1: CSS Narrowing

Generate CSS selector from EID and query DOM.

**Goal**: Narrow candidate set using browser's native query engine.

**Process**:
1. Build CSS selector from anchor + path + target
2. Execute `querySelectorAll()` on root
3. Limit candidates (default: 100 max)

**Example**:
```typescript
// EID: form :: button[type="submit"]
const selector = 'form button[type="submit"]';
const candidates = document.querySelectorAll(selector);
```

## Phase 2: Semantic Filtering

Score candidates by semantic similarity.

**Goal**: Filter candidates that don't match target semantics.

**Scoring**:
- Text match: 30%
- Attributes match: 30%
- Class match: 20%
- Role match: 10%
- ID match: 10%

**Process**:
1. For each candidate, calculate semantic score
2. Filter out candidates below threshold (< 0.5)
3. Sort by score (highest first)

## Phase 3: Uniqueness Check

Check if exactly one candidate remains.

**Goal**: Early exit for common case (single match).

**Process**:
```typescript
if (filtered.length === 1) {
  return {
    status: 'success',
    elements: filtered,
    confidence: eid.meta.confidence
  };
}
```

## Phase 4: Constraints Evaluation

Apply disambiguation constraints.

**Goal**: Further filter ambiguous results.

**Constraints**:
- **Uniqueness**: Must be only match
- **Visibility**: Must be visible
- **Text Proximity**: Must be near specific text
- **Position**: Must be at specific position

**Process**:
```typescript
for (const constraint of eid.constraints) {
  candidates = evaluateConstraint(candidates, constraint);
}
```

## Phase 5: Handle Ambiguity

Handle multiple matches or no matches.

**Goal**: Return best result with appropriate status.

**Cases**:
1. **No matches + fallback enabled**: Try fallback rules
2. **No matches + no fallback**: Return error
3. **Multiple matches**: Return all (status: 'ambiguous')
4. **Fallback match**: Return with degraded confidence

**Result Statuses**:
- `success`: Single perfect match
- `ambiguous`: Multiple matches found
- `degraded-fallback`: Partial match via fallback
- `error`: No matches found

## Complete Flow

```
Element Identity (EID)
  ↓
Phase 1: CSS Narrowing (querySelectorAll)
  ↓
Phase 2: Semantic Filtering (score & filter)
  ↓
Phase 3: Uniqueness Check (early exit if 1 match)
  ↓
Phase 4: Constraints Evaluation (apply rules)
  ↓
Phase 5: Handle Ambiguity (return result)
  ↓
ResolveResult { status, elements, confidence }
```

## Performance

- **Phase 1**: Fastest (native browser query)
- **Phase 2**: Medium (JS scoring)
- **Phase 3**: Instant (check length)
- **Phase 4**: Fast (simple filters)
- **Phase 5**: Varies (depends on fallback)

**Typical timing** (1000 elements in DOM):
- Phase 1: ~5ms
- Phase 2: ~10ms
- Phases 3-5: ~2ms
- **Total**: ~17ms
