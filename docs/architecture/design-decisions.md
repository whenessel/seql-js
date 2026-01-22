# Design Decisions

Key architectural choices and their rationale.

## 1. Why Semantic-First?

**Decision**: Prioritize semantic HTML/ARIA over structural selectors.

**Rationale**:

- Semantic attributes change less frequently than structure
- Developers update DOM structure often during refactoring
- ARIA attributes indicate intent, not implementation

**Trade-off**: May be less specific initially, but more stable long-term.

## 2. Why Dual Format (EID + SEQL)?

**Decision**: Provide both JSON and string representations.

**Rationale**:

- JSON: Rich metadata for programmatic use
- String: Compact for analytics/transport

**Trade-off**: Maintain two formats, but each optimized for its use case.

## 3. Why State Independence? (v1.0.3)

**Decision**: Filter out state attributes like `aria-selected`, `disabled`.

**Rationale**:

- Element identity doesn't change with state
- Analytics should track "what" was clicked, not its state
- Enables consistent identification across sessions

**Trade-off**: Can't distinguish between states, but that's intentional.

## 4. Why nth-child? (v1.1.0)

**Decision**: Include positional information when needed.

**Rationale**:

- Disambiguates identical siblings
- Essential for tables, lists with uniform items
- Only used when semantic features insufficient

**Trade-off**: Less resilient to reordering, but necessary for precision.

## 5. Why 5-Phase Resolution?

**Decision**: Multi-phase algorithm with early exits.

**Rationale**:

- Phase 1 (CSS): Fast native browser query
- Phase 3: Early exit for common case (single match)
- Phases 2,4,5: Only when needed

**Trade-off**: More complex, but optimized for common paths.

## 6. Why WeakMap for Cache?

**Decision**: Use WeakMap for element-keyed caches.

**Rationale**:

- Automatic garbage collection when elements removed
- No memory leaks from detached DOM
- Zero manual cache management

**Trade-off**: Can't iterate cache, but not needed.

## 7. Why LRU for Selector Cache?

**Decision**: Use LRU cache for CSS selector results.

**Rationale**:

- Bounded memory usage (default: 1000 entries)
- Evicts least-recently-used entries automatically
- Balances hit rate and memory

**Trade-off**: May evict useful entries, but prevents unbounded growth.

## 8. Why Zero Dependencies?

**Decision**: No external runtime dependencies.

**Rationale**:

- Smaller bundle size
- No version conflicts
- Easier to audit/trust
- Tree-shakeable

**Trade-off**: Implement utilities ourselves, but keeps library lean.

## 9. Why TypeScript?

**Decision**: Write in TypeScript, ship both TS and JS.

**Rationale**:

- Type safety during development
- Better IDE support for consumers
- Self-documenting types

**Trade-off**: Build step required, but standard practice.

## 10. Why Anchor Tiers?

**Decision**: Prioritize anchors by semantic strength.

**Rationale**:

- Tier A (`<form>`, `<main>`): Strongest semantic meaning
- Tier B (ARIA roles): Still strong
- Tier C (test IDs, body): Fallback only

**Trade-off**: Hierarchy adds complexity, but improves EID quality.
