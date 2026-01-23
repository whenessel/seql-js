# Test Coverage Implementation Plan

## Overview

Implement missing tests to achieve coverage targets:
- **Unit tests**: 61.69% → 85% statements (+23.31%)
- **Integration tests**: 65.23% → 70% statements (+4.77%)

## Current Coverage Analysis

### Critical Gaps (0% coverage)
1. `svg-fingerprinter.ts` - SVG identification (0%)
2. `constraints-evaluator.ts` - Disambiguation logic (0%)

### High-Impact Low Coverage
3. `fallback-handler.ts` - Resolution failures (16.12%)
4. `semantics-matcher.ts` - Phase 2 filtering (24%)
5. `batch-generator.ts` - Batch processing (5.35%)

### Core Modules Needing Expansion
6. `validator.ts` - EID validation (54.34%)
7. `scorer.ts` - Scoring algorithms (50%)
8. `resolver.ts` - 5-phase orchestration (45.71%)
9. `path-builder.ts` - Path construction (52.38%)

## Implementation Strategy

### Phase 1: Zero Coverage Modules (Priority 1)

#### 1. Create `tests/unit/svg-fingerprinter.test.ts` (18-20 tests)

**Test categories:**
- Basic fingerprinting (7 tests): rect, circle, ellipse, line, path, polygon, g elements
- Path hashing (5 tests): consistent hash, normalization, truncation, empty/malformed data
- Geometry hashing (4 tests): aspect ratio (rect), radii ratio (ellipse), angle (line), edge cases
- Animation detection (4 tests): SMIL, CSS animations, transitions, static SVG

**Key patterns:**
```typescript
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
rect.setAttribute('width', '100');
rect.setAttribute('height', '50');
```

**Critical files:**
- [src/generator/svg-fingerprinter.ts](src/generator/svg-fingerprinter.ts)
- Reference [src/resolver/semantics-matcher.ts](src/resolver/semantics-matcher.ts:122-191) for hash duplication

#### 2. Create `tests/unit/constraints-evaluator.test.ts` (20-22 tests)

**Test categories:**
- Text proximity (5 tests): exact match, within threshold, beyond threshold, empty text, missing content
- Levenshtein algorithm (7 tests): identical strings, insertions, deletions, substitutions, complex cases, edge cases, memory optimization
- Position constraints (6 tests): first-in-dom, top-most, left-most, getBoundingClientRect errors, single candidate, failure handling
- Uniqueness (2 tests): pass-through behavior

**Mock strategy:**
```typescript
Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
  top: 100, left: 50, right: 150, bottom: 200,
  width: 100, height: 100, x: 50, y: 100,
  toJSON: () => ({})
});
```

**Critical algorithm tests:**
- Levenshtein "kitten" → "sitting" = 3
- Single-row optimization verification

**Critical file:**
- [src/resolver/constraints-evaluator.ts](src/resolver/constraints-evaluator.ts)

### Phase 2: High-Impact Modules (Priority 2)

#### 3. Create `tests/unit/fallback-handler.test.ts` (22-25 tests)

**Test categories:**
- onMissing strategies (4 tests): anchor-only, strict, none, missing anchor
- onMultiple strategies (3 tests): first, allow-multiple, best-score
- Best scoring algorithm (8 tests): ID weight (0.3), class weight (0.25), attribute weight (0.2), role weight (0.15), text exact (0.1), text partial (0.05), normalization, no features
- Confidence degradation (5 tests): 0.3x anchor, 0.7x first, 0.5x allow-multiple, best-score adjustment, metadata preservation

**Critical file:**
- [src/resolver/fallback-handler.ts](src/resolver/fallback-handler.ts)

#### 4. Create `tests/unit/semantics-matcher.test.ts` (28-30 tests)

**Test categories:**
- Text matching (6 tests): exact, partial, direct text nodes, textContent fallback, normalization, empty text
- Attribute matching (4 tests): single, multiple, mismatch, missing attributes
- SVG fingerprint matching (10 tests): shape tag, dHash, geomHash for rect/circle/ellipse/line, title text, mismatches
- Hash computation (5 tests): path hash identical to SvgFingerprinter, geomHash identical, simpleHash consistency, number normalization
- Filter operations (3 tests): filter array, empty results, all match

**Critical issue:** Hash logic duplicated from svg-fingerprinter - tests must verify identical behavior

**Critical file:**
- [src/resolver/semantics-matcher.ts](src/resolver/semantics-matcher.ts)

#### 5. Expand `tests/unit/batch-generator.test.ts` (25-28 tests)

**Current:** 5.35% coverage
**Target:** 85%+

**Test categories:**
- Basic operations (5 tests): generate all, CSS selector filter, element limit, skip tags, skip non-semantic
- Priority processing (4 tests): HIGH (stable ID), MEDIUM (semantic attrs), LOW (generic), sorting
- Progress reporting (4 tests): onProgress calls, progressInterval, final 100%, missing callback
- Caching (4 tests): cache hits, cache misses, hit rate calculation, custom cache
- Error handling (3 tests): collect failures, continue after errors, throw for missing root
- Cancellation (2 tests): abort signal, partial results
- Statistics (3 tests): totalTimeMs, avgTimePerElementMs, counts

**Critical file:**
- [src/utils/batch-generator.ts](src/utils/batch-generator.ts)

### Phase 3: Core Modules (Priority 3)

#### 6. Create `tests/unit/validator.test.ts` (28-30 tests)

**Test categories:**
- Version validation (3 tests): accept "1.0", warn unknown, error missing
- Anchor validation (4 tests): missing anchor, missing tag, missing score, missing semantics
- Target validation (4 tests): missing target, missing tag, missing score, missing semantics
- Path validation (5 tests): not array, empty array, missing tag, missing semantics, validate each node
- Meta/constraints/fallback (4 tests): missing meta, missing confidence, constraints not array, missing fallback
- isEID type guard (8 tests): valid EID, null/undefined, non-object, missing version/anchor/target, non-array path, TypeScript narrowing

**Critical file:**
- [src/utils/validator.ts](src/utils/validator.ts)

#### 7. Create `tests/unit/scorer.test.ts` (16-18 tests)

**Test categories:**
- Confidence calculation (8 tests): ANCHOR weight, PATH weight, TARGET weight, UNIQUENESS bonus, empty path (0.5), degradation penalty (-0.2), clamp [0,1], weighted sum
- Element score calculation (7 tests): base 0.5, +0.2 stable ID, +0.15 ARIA role, +0.05 per semantic feature (max 0.15), cap 1.0, zero features, max features
- Edge cases (3 tests): clamp negative, clamp > 1, all zeros

**Critical file:**
- [src/utils/scorer.ts](src/utils/scorer.ts)

#### 8. Create `tests/unit/resolver.test.ts` (22-25 tests)

**Test categories:**
- Phase 1: CSS Narrowing (4 tests): build selector, query candidates, invalid selector, maxCandidates limit
- Phase 2: Semantics Filtering (2 tests): filter by target semantics, use SemanticsMatcher
- Phase 3: Uniqueness (3 tests): single match success, multiple → Phase 4, zero → fallback
- Phase 4: Constraints (4 tests): sort by priority, apply sequentially, unique after constraints, over-constrained → fallback
- Phase 5: Ambiguous (2 tests): ambiguous in strictMode, FallbackHandler for multiple
- Options (4 tests): merge with defaults, enableFallback flag, strictMode flag, maxCandidates
- Confidence degradation (3 tests): preserve unique, 0.9x constraint, 0.7x ambiguous

**Critical file:**
- [src/resolver/resolver.ts](src/resolver/resolver.ts)

#### 9. Create `tests/unit/path-builder.test.ts` (28-30 tests)

**Test categories:**
- Basic path building (4 tests): anchor to target, exclude anchor/target, traverse upward, maxPathDepth
- Depth overflow (2 tests): set degraded=true, set degradationReason
- Noise filtering (8 tests): include semantic tags, exclude plain div, include div with role/aria/stable classes/data-testid/stable ID, exclude utility classes
- Uniqueness algorithm (7 tests): test selector uniqueness, add skipped nodes, prioritize high score, skip below MIN_CONFIDENCE_FOR_SKIP, insert in DOM order, stop when unique, cache queries
- nth-child calculation (3 tests): 1-based position, no parent, use parent.children
- Cache integration (2 tests): cache results, work without cache

**Critical file:**
- [src/generator/path-builder.ts](src/generator/path-builder.ts)

### Phase 4: Integration Tests (Priority 4)

#### 10. Create `tests/integration/constraints-evaluation.test.ts` (12-15 tests)

**Test categories:**
- End-to-end text proximity (3 tests): resolve similar text button, reject very different, select closest
- End-to-end position (3 tests): top-most card, left-most item, first-in-dom fallback
- Integration with resolver (3 tests): apply in Phase 4, sort by priority, stop when unique
- Real-world scenarios (3 tests): disambiguate Submit buttons, product cards, overlapping modals

**Targets:**
- [src/resolver/constraints-evaluator.ts](src/resolver/constraints-evaluator.ts) - 0% → 65%+
- [src/resolver/resolver.ts](src/resolver/resolver.ts) - integration testing

#### 11. Create `tests/integration/svg-elements.test.ts` (10-12 tests)

**Test categories:**
- Generation & resolution (4 tests): round-trip path/rect/animated/nested SVGs
- Real icon libraries (3 tests): Lucide icons, Font Awesome SVG, Material Design Icons
- Complex structures (3 tests): distinguish similar icons, multiple paths, different contexts

**Targets:**
- [src/generator/svg-fingerprinter.ts](src/generator/svg-fingerprinter.ts) - integration coverage
- [src/resolver/semantics-matcher.ts](src/resolver/semantics-matcher.ts) - SVG matching

#### 12. Create `tests/integration/validation.test.ts` (8-10 tests)

**Test categories:**
- End-to-end validation (3 tests): validate generated EIDs, detect malformed external, JSON round-trip
- Error detection (3 tests): missing fields, deprecated features, collect errors/warnings
- Type guard usage (2 tests): runtime checks, TypeScript narrowing

**Targets:**
- [src/utils/validator.ts](src/utils/validator.ts) - 0% → 65%+

#### 13. Expand existing integration tests

**`tests/integration/resolver.test.ts`** - Add 10-12 tests:
- Fallback scenarios: anchor when target removed, best-score for multiple
- Performance: 100+ candidates
- DOM variations: SPA-style, server-rendered, Shadow DOM
- Resilience: CSS class changes, text changes
- Complex structures: nested forms, tables

**`tests/integration/batch-generator.test.ts`** - Add 8-10 tests:
- Scale: 1000+ elements, 50+ level nesting
- Memory: no leaks, clear cache option
- Resilience: DOM mutation mid-batch, partial failures
- Signal: AbortSignal correctness, accurate progress

## Test Execution Order

### Step 1: Run baseline coverage
```bash
yarn test:unit:coverage
yarn test:integration:coverage
```

### Step 2: Implement Phase 1 (Zero Coverage)
```bash
# Create svg-fingerprinter.test.ts
yarn test:unit --coverage tests/unit/svg-fingerprinter.test.ts

# Create constraints-evaluator.test.ts
yarn test:unit --coverage tests/unit/constraints-evaluator.test.ts
```

### Step 3: Implement Phase 2 (High-Impact)
```bash
# Create fallback-handler.test.ts, semantics-matcher.test.ts
# Expand batch-generator.test.ts
yarn test:unit:coverage
```

### Step 4: Implement Phase 3 (Core Modules)
```bash
# Create validator.test.ts, scorer.test.ts, resolver.test.ts, path-builder.test.ts
yarn test:unit:coverage
```

### Step 5: Implement Phase 4 (Integration)
```bash
# Create integration tests
yarn test:integration:coverage
```

### Step 6: Final verification
```bash
yarn test:coverage
```

## Coverage Threshold Adjustments

Update configuration files after test implementation:

**`vitest.config.unit.ts`:**
```typescript
thresholds: {
  statements: 85,  // Keep
  branches: 80,    // Increase from 75
  functions: 80,   // Keep
  lines: 85,       // Keep
}
```

**`vitest.config.integration.ts`:**
```typescript
thresholds: {
  statements: 70,  // Keep
  branches: 65,    // Increase from 60
  functions: 65,   // Keep
  lines: 70,       // Keep
}
```

**Rationale:** Branch coverage is critical for conditional logic in resolver/generator pipelines. Current branch coverage (51.99% unit, 56.29% integration) is significantly below other metrics, indicating untested edge cases.

## Testing Best Practices

1. **Isolation:** Unit tests should mock dependencies, use jsdom for DOM
2. **Coverage Focus:** Prioritize branch coverage for conditional logic
3. **Edge Cases:** Test empty strings, null/undefined, boundary conditions
4. **Real-World Data:** Integration tests use realistic HTML structures
5. **Performance:** Benchmark tests for batch operations (1000+ elements)
6. **Consistency:** Follow patterns from [tests/unit/class-classifier.test.ts](tests/unit/class-classifier.test.ts)

## Verification Checklist

After implementation, verify:
- [ ] Unit coverage ≥85% statements, ≥80% branches
- [ ] Integration coverage ≥70% statements, ≥65% branches
- [ ] All critical modules (svg-fingerprinter, constraints-evaluator, etc.) ≥85%
- [ ] No skipped/todo tests
- [ ] All tests pass consistently: `yarn test`
- [ ] Coverage badges updated
- [ ] `yarn test:coverage` passes threshold enforcement

## Expected Outcomes

**Unit Tests:**
- Current: 61.69% statements, 51.99% branches
- Target: 85% statements, 80% branches
- Gap closed: +23.31% statements, +28.01% branches

**Integration Tests:**
- Current: 65.23% statements, 56.29% branches
- Target: 70% statements, 65% branches
- Gap closed: +4.77% statements, +8.71% branches

**Total new tests:** ~200-220 test cases across 12 new files + expansions

## Risk Mitigation

1. **Hash duplication:** semantics-matcher duplicates svg-fingerprinter hashing - tests must verify identical behavior to prevent bugs
2. **Levenshtein complexity:** Extensive test cases required for single-row optimization
3. **jsdom limitations:** Some CSS/animation tests may need mocking
4. **Batch processing:** Memory leak tests require careful setup/teardown
