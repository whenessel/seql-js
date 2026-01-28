# Implementation Plan: Analytics Attribute Filtering

**Version Info:**
- Current version: 1.3.0
- Target version: 1.4.0

## Overview

Add comprehensive filtering for analytics and tracking attributes to prevent unstable third-party tracking data from being included in Element Identity Descriptors (EIDs). This ensures EIDs remain stable across marketing campaigns, analytics configuration changes, and A/B testing variations.

## Rationale

Analytics attributes are inherently unstable because they:
- Change based on marketing campaigns, not UI structure
- Differ across environments (dev/staging/prod)
- Are temporary and campaign-specific
- Don't represent an element's semantic identity
- Can cause false EID mismatches during resolution

## Implementation Strategy

### 1. Core Logic Changes (`src/utils/attribute-filters.ts`)

**Add two new constant arrays:**

```typescript
/**
 * Analytics and tracking data-* prefixes to exclude
 * These are used by third-party analytics tools and change based on
 * tracking configuration, not element identity
 */
export const ANALYTICS_DATA_PREFIXES = [
  // Google Analytics / GTM
  'data-ga',
  'data-gtm',
  'data-google',
  'data-layer',
  'data-event',

  // Yandex Metrica
  'data-yandex',
  'data-ym',
  'data-metrika',

  // A/B Testing
  'data-optimizely',
  'data-vwo',
  'data-optimize',

  // Session Recording
  'data-hj',
  'data-hotjar',
  'data-fs',
  'data-mouseflow',
  'data-mf',
  'data-smartlook',
  'data-sl',

  // Social / Ad Pixels
  'data-fb',
  'data-facebook',
  'data-tt',
  'data-li',

  // Generic Tracking
  'data-track',
  'data-tracking',
  'data-click',
  'data-impression',
  'data-conversion',
  'data-segment',
  'data-analytics',
] as const;

/**
 * Exact-match analytics attributes (potential semantic conflicts)
 */
export const ANALYTICS_EXACT_ATTRIBUTES = [
  'data-category',  // Google Analytics category
  'data-action',    // Google Analytics action
  'data-label',     // Google Analytics label
  'data-value',     // Google Analytics value
] as const;
```

**Modify `isStableAttribute()` function:**

Insert analytics filtering **after line 157** (after test ID patterns) and **before line 160** (before `-id` suffix check):

```typescript
// Line 157: Whitelist data-* ID patterns (exact match)
if ((DATA_ID_PATTERNS as readonly string[]).includes(name)) return true;

// NEW: Blacklist analytics prefixes (BEFORE -id suffix check)
if (ANALYTICS_DATA_PREFIXES.some((prefix) => name.startsWith(prefix))) {
  return false;
}

// NEW: Blacklist analytics exact-match attributes
if ((ANALYTICS_EXACT_ATTRIBUTES as readonly string[]).includes(name)) {
  return false;
}

// Line 160: Whitelist data-* ending with -id
if (name.startsWith('data-') && name.endsWith('-id')) return true;
```

**Critical order reasoning:**
- Test attributes (`data-testid`, `data-qa`) are checked FIRST → always allowed
- Analytics patterns checked SECOND → blocks `data-tracking-id`, `data-analytics-id`
- Generic `-id` suffix checked THIRD → allows `data-product-id`, `data-user-id`

### 2. Unit Tests (`tests/unit/attribute-filtering.test.ts`)

**Add comprehensive test suite (~50 test cases):**

```typescript
describe('Analytics attribute filtering', () => {
  describe('Google Analytics / GTM', () => {
    it('should exclude data-ga* patterns', () => {
      expect(isStableAttribute('data-ga-click', 'event')).toBe(false);
      expect(isStableAttribute('data-gtm-event', 'click')).toBe(false);
      expect(isStableAttribute('data-google-analytics', 'UA-123')).toBe(false);
      expect(isStableAttribute('data-layer-event', 'purchase')).toBe(false);
    });

    it('should exclude GA exact-match attributes', () => {
      expect(isStableAttribute('data-category', 'electronics')).toBe(false);
      expect(isStableAttribute('data-action', 'click')).toBe(false);
      expect(isStableAttribute('data-label', 'banner')).toBe(false);
      expect(isStableAttribute('data-value', '100')).toBe(false);
    });
  });

  describe('Yandex Metrica', () => {
    it('should exclude Yandex patterns', () => {
      expect(isStableAttribute('data-yandex-counter', '123')).toBe(false);
      expect(isStableAttribute('data-ym-goal', 'purchase')).toBe(false);
      expect(isStableAttribute('data-metrika-event', 'click')).toBe(false);
    });
  });

  describe('Session Recording tools', () => {
    it('should exclude Hotjar patterns', () => {
      expect(isStableAttribute('data-hj-ignore', 'true')).toBe(false);
      expect(isStableAttribute('data-hotjar-track', 'yes')).toBe(false);
    });

    it('should exclude FullStory patterns', () => {
      expect(isStableAttribute('data-fs-element', 'button')).toBe(false);
    });

    it('should exclude Mouseflow patterns', () => {
      expect(isStableAttribute('data-mouseflow-track', 'yes')).toBe(false);
      expect(isStableAttribute('data-mf-click', 'event')).toBe(false);
    });

    it('should exclude Smartlook patterns', () => {
      expect(isStableAttribute('data-smartlook-ignore', 'true')).toBe(false);
      expect(isStableAttribute('data-sl-event', 'click')).toBe(false);
    });
  });

  describe('A/B Testing tools', () => {
    it('should exclude Optimizely patterns', () => {
      expect(isStableAttribute('data-optimizely-variation', 'A')).toBe(false);
    });

    it('should exclude VWO patterns', () => {
      expect(isStableAttribute('data-vwo-test', '123')).toBe(false);
    });

    it('should exclude Google Optimize patterns', () => {
      expect(isStableAttribute('data-optimize-experiment', 'exp1')).toBe(false);
    });
  });

  describe('Social / Ad Pixels', () => {
    it('should exclude Facebook pixel patterns', () => {
      expect(isStableAttribute('data-fb-event', 'PageView')).toBe(false);
      expect(isStableAttribute('data-facebook-pixel', '123')).toBe(false);
    });

    it('should exclude TikTok pixel patterns', () => {
      expect(isStableAttribute('data-tt-event', 'ViewContent')).toBe(false);
    });

    it('should exclude LinkedIn pixel patterns', () => {
      expect(isStableAttribute('data-li-pixel', '456')).toBe(false);
    });
  });

  describe('Generic tracking patterns', () => {
    it('should exclude generic tracking patterns', () => {
      expect(isStableAttribute('data-track-event', 'click')).toBe(false);
      expect(isStableAttribute('data-tracking-code', 'abc')).toBe(false);
      expect(isStableAttribute('data-click-tracking', 'yes')).toBe(false);
      expect(isStableAttribute('data-impression-id', '123')).toBe(false);
      expect(isStableAttribute('data-conversion-value', '50')).toBe(false);
      expect(isStableAttribute('data-segment-event', 'signup')).toBe(false);
    });
  });

  describe('Edge cases: analytics *-id patterns', () => {
    it('should exclude analytics-id and tracking-id (analytics prefix wins)', () => {
      // BREAKING CHANGE: These were previously allowed, now blocked
      expect(isStableAttribute('data-tracking-id', 'track-123')).toBe(false);
      expect(isStableAttribute('data-analytics-id', 'ga-456')).toBe(false);
      expect(isStableAttribute('data-ga-id', 'UA-123')).toBe(false);
      expect(isStableAttribute('data-event-id', 'evt-789')).toBe(false);
      expect(isStableAttribute('data-impression-id', 'imp-456')).toBe(false);
    });

    it('should still allow non-analytics *-id patterns', () => {
      expect(isStableAttribute('data-product-id', '12345')).toBe(true);
      expect(isStableAttribute('data-user-id', 'abc')).toBe(true);
      expect(isStableAttribute('data-custom-id', '123')).toBe(true);
      expect(isStableAttribute('data-entity-id', '456')).toBe(true);
      expect(isStableAttribute('data-order-id', '789')).toBe(true);
    });
  });

  describe('Test attributes remain protected', () => {
    it('should still include all test attributes despite any conflicts', () => {
      expect(isStableAttribute('data-testid', 'btn')).toBe(true);
      expect(isStableAttribute('data-test', 'submit')).toBe(true);
      expect(isStableAttribute('data-qa', 'form')).toBe(true);
      expect(isStableAttribute('data-cy', 'input')).toBe(true);
      expect(isStableAttribute('data-automation-id', 'link')).toBe(true);
    });
  });

  describe('Semantic data-* attributes remain allowed', () => {
    it('should allow semantic data attributes that do not match analytics patterns', () => {
      expect(isStableAttribute('data-role', 'admin')).toBe(true);
      expect(isStableAttribute('data-type', 'primary')).toBe(true);
      expect(isStableAttribute('data-status', 'pending')).toBe(true);
      expect(isStableAttribute('data-feature', 'enabled')).toBe(true);
    });
  });
});
```

**Update existing tests that will break:**

The test needs to be updated to reflect the new behavior where analytics-related `-id` attributes are now blocked.

### 3. Integration Tests (`tests/integration/generator-attribute-filtering.test.ts`)

**Add end-to-end scenarios:**

```typescript
describe('Analytics attribute filtering in EID generation', () => {
  it('should exclude analytics attributes from generated EID', () => {
    const form = document.createElement('form');
    form.id = 'checkout-form';

    const button = document.createElement('button');
    button.setAttribute('data-testid', 'submit-btn');      // STABLE ✓
    button.setAttribute('data-ga-event', 'purchase');       // ANALYTICS ✗
    button.setAttribute('data-tracking-id', 'track-123');   // ANALYTICS ✗
    button.setAttribute('data-category', 'checkout');       // ANALYTICS ✗
    button.setAttribute('aria-label', 'Submit Order');      // STABLE ✓
    button.textContent = 'Submit';

    form.appendChild(button);
    document.body.appendChild(form);

    const eid = generateEID(button);
    const eidJson = JSON.stringify(eid);

    // Stable attributes should be present
    expect(eidJson).toContain('submit-btn');
    expect(eidJson).toContain('Submit');

    // Analytics attributes should be excluded
    expect(eidJson).not.toContain('data-ga-event');
    expect(eidJson).not.toContain('purchase');
    expect(eidJson).not.toContain('track-123');
    expect(eidJson).not.toContain('data-category');
  });

  it('should handle mixed tracking and semantic attributes', () => {
    const div = document.createElement('div');
    div.setAttribute('data-product-id', '12345');           // STABLE ✓
    div.setAttribute('data-ga-click', 'product-click');     // ANALYTICS ✗
    div.setAttribute('data-hj-suppress', 'true');           // ANALYTICS ✗
    div.setAttribute('role', 'article');                    // STABLE ✓
    document.body.appendChild(div);

    const eid = generateEID(div);
    const eidJson = JSON.stringify(eid);

    // Semantic attributes included
    expect(eidJson).toContain('12345');
    expect(eidJson).toContain('article');

    // Analytics excluded
    expect(eidJson).not.toContain('data-ga-click');
    expect(eidJson).not.toContain('data-hj-suppress');
  });

  it('should filter Yandex Metrica attributes', () => {
    const link = document.createElement('a');
    link.setAttribute('href', '/product');                  // STABLE ✓
    link.setAttribute('data-yandex-goal', 'click-product'); // ANALYTICS ✗
    link.setAttribute('data-ym-event', 'interaction');      // ANALYTICS ✗
    link.setAttribute('data-testid', 'product-link');       // STABLE ✓
    link.textContent = 'View Product';
    document.body.appendChild(link);

    const eid = generateEID(link);
    const eidJson = JSON.stringify(eid);

    expect(eidJson).toContain('product');
    expect(eidJson).not.toContain('yandex');
    expect(eidJson).not.toContain('data-ym');
  });

  it('should handle complex forms with multiple analytics tools', () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'email');                    // STABLE ✓
    input.setAttribute('name', 'user-email');               // STABLE ✓
    input.setAttribute('data-qa', 'email-input');           // STABLE ✓
    input.setAttribute('data-gtm-event', 'email-entered');  // ANALYTICS ✗
    input.setAttribute('data-optimizely-element', 'form1'); // ANALYTICS ✗
    input.setAttribute('data-fb-track', 'Lead');            // ANALYTICS ✗
    document.body.appendChild(input);

    const eid = generateEID(input);
    const eidJson = JSON.stringify(eid);

    expect(eidJson).toContain('email');
    expect(eidJson).toContain('user-email');
    expect(eidJson).not.toContain('gtm');
    expect(eidJson).not.toContain('optimizely');
    expect(eidJson).not.toContain('data-fb-track');
  });

  it('should preserve resolution stability without analytics attributes', () => {
    // Create element with mixed attributes
    const button = document.createElement('button');
    button.setAttribute('data-testid', 'action-btn');
    button.setAttribute('data-track-click', 'campaign-123'); // will be filtered
    button.textContent = 'Click Me';
    document.body.appendChild(button);

    // Generate EID
    const eid = generateEID(button);

    // Verify EID doesn't contain analytics
    const eidJson = JSON.stringify(eid);
    expect(eidJson).not.toContain('track-click');

    // Resolution should work without analytics attributes
    const resolved = resolve(eid, document);
    expect(resolved.elements).toHaveLength(1);
    expect(resolved.elements[0]).toBe(button);
  });
});
```

### 4. Documentation Updates

**File: `docs/specification/attribute-filtering.md`**

Add new section after existing state attributes documentation:

```markdown
## Analytics & Tracking Attributes (v1.4.0)

### Overview

❌ **Excluded** - Third-party analytics, tracking, and experimentation attributes

These attributes are used by analytics platforms, session recording tools, A/B testing frameworks, and advertising pixels. They change based on marketing campaigns and tracking configuration, not element identity.

### Filtered Patterns

#### Google Analytics / GTM
- `data-ga*`, `data-gtm*`, `data-google-*`
- `data-layer*`, `data-event*`
- `data-category`, `data-action`, `data-label`, `data-value`

**Rationale**: GA attributes change per campaign, environment, and tracking requirements.

#### Yandex Metrica
- `data-yandex*`, `data-ym*`, `data-metrika*`

**Rationale**: Russian analytics platform with dynamic tracking attributes.

#### Session Recording
- **Hotjar**: `data-hj*`, `data-hotjar*`
- **FullStory**: `data-fs*`
- **Mouseflow**: `data-mouseflow*`, `data-mf*`
- **Smartlook**: `data-smartlook*`, `data-sl*`

**Rationale**: Session replay tools inject tracking attributes for heatmaps and recordings.

#### A/B Testing
- **Optimizely**: `data-optimizely*`
- **VWO**: `data-vwo*`
- **Google Optimize**: `data-optimize*`

**Rationale**: Experiment variations change frequently and are environment-specific.

#### Social / Ad Pixels
- **Facebook**: `data-fb*`, `data-facebook*`
- **TikTok**: `data-tt*`
- **LinkedIn**: `data-li*`

**Rationale**: Advertising pixels track conversions, not element identity.

#### Generic Tracking
- `data-track*`, `data-tracking*`
- `data-click*`, `data-impression*`
- `data-conversion*`, `data-segment*`
- `data-analytics*`

**Rationale**: Custom tracking implementations vary by marketing needs.

### Important Edge Cases

#### Analytics `-id` Suffix Conflict

**Problem**: Some analytics attributes end with `-id` (e.g., `data-tracking-id`, `data-analytics-id`), which might suggest they're stable identifiers.

**Decision**: Analytics prefix matching takes **precedence** over the `-id` suffix rule. These attributes are **blocked**.

**Examples**:
- ❌ `data-tracking-id="track-123"` → BLOCKED (analytics)
- ❌ `data-analytics-id="ga-456"` → BLOCKED (analytics)
- ❌ `data-event-id="evt-789"` → BLOCKED (analytics)
- ✅ `data-product-id="12345"` → ALLOWED (semantic ID)
- ✅ `data-user-id="abc"` → ALLOWED (semantic ID)

#### Test Attributes Protected

Test and QA attributes are **always allowed** regardless of name similarity:
- ✅ `data-testid`, `data-test`, `data-qa`, `data-cy` → ALLOWED (whitelisted)

#### Semantic Conflicts

Some analytics attributes have semantic-sounding names:
- ❌ `data-category` → BLOCKED (GA category, use `data-product-category` instead)
- ❌ `data-label` → BLOCKED (GA label, use `data-aria-label` or semantic HTML)
- ❌ `data-value` → BLOCKED (GA value, use `data-amount`, `data-price`, etc.)

### Migration Guide

If your application uses `data-tracking-id` or `data-analytics-id` for semantic identification:

**Before:**
```html
<button data-tracking-id="user-submit-btn">Submit</button>
```

**After (use semantic naming):**
```html
<button data-component-id="user-submit-btn">Submit</button>
<!-- or -->
<button data-entity-id="user-submit-btn">Submit</button>
<!-- or -->
<button data-testid="user-submit-btn">Submit</button>
```

### Benefits

- ✅ Stable EIDs across marketing campaigns
- ✅ Consistent identification across dev/staging/prod
- ✅ No false mismatches due to analytics changes
- ✅ Smaller EID payloads (fewer attributes)
- ✅ Better privacy (no tracking data in EIDs)
```

**File: `CHANGELOG.md`**

Add entry:

```markdown
## [1.4.0] - 2026-01-28

### Added
- Comprehensive analytics attribute filtering to improve EID stability
- Support for filtering Google Analytics, GTM, Yandex Metrica, Hotjar, FullStory, Mouseflow, Smartlook, Optimizely, VWO, Facebook Pixel, TikTok Pixel, LinkedIn Pixel attributes
- 28 new analytics prefix patterns and 4 exact-match patterns

### Changed
- **BREAKING**: `data-tracking-id` and `data-analytics-id` are now filtered out (analytics prefix takes precedence over `-id` suffix rule)
- **BREAKING**: `data-category`, `data-action`, `data-label`, `data-value` are now filtered out (Google Analytics attributes)

### Migration
If using `data-tracking-id` or `data-analytics-id` for semantic identification, rename to:
- `data-component-id`
- `data-entity-id`
- `data-testid`

See `docs/specification/attribute-filtering.md` for full migration guide.
```

## Files to Modify

### Core Implementation
- **`src/utils/attribute-filters.ts`** (Lines 80-158)
  - Add `ANALYTICS_DATA_PREFIXES` constant array (~28 items)
  - Add `ANALYTICS_EXACT_ATTRIBUTES` constant array (~4 items)
  - Insert analytics filtering logic after line 157, before line 160

### Unit Tests
- **`tests/unit/attribute-filtering.test.ts`**
  - Add ~50 new test cases covering all analytics categories
  - Add edge case tests for `-id` suffix conflicts
  - Update existing tests that expect `data-tracking-id` to be true (will now be false)

### Integration Tests
- **`tests/integration/generator-attribute-filtering.test.ts`**
  - Add 5 new integration scenarios
  - Test complex real-world combinations of analytics and semantic attributes

### Documentation
- **`docs/specification/attribute-filtering.md`**
  - Add new "Analytics & Tracking Attributes" section
  - Document edge cases and migration guide

- **`CHANGELOG.md`**
  - Add version 1.3.0 entry with breaking changes

## Breaking Changes

### 1. `data-tracking-id` and `data-analytics-id`

**Before (v1.2.x):**
```typescript
isStableAttribute('data-tracking-id', 'track-123') // → true (allowed via -id suffix)
isStableAttribute('data-analytics-id', 'ga-456')   // → true (allowed via -id suffix)
```

**After (v1.4.0):**
```typescript
isStableAttribute('data-tracking-id', 'track-123') // → false (blocked by analytics prefix)
isStableAttribute('data-analytics-id', 'ga-456')   // → false (blocked by analytics prefix)
```

**Impact**: Applications relying on these attributes for element identification will need to rename them to semantic alternatives like `data-component-id` or `data-entity-id`.

### 2. Google Analytics Standard Attributes

**Before (v1.2.x):**
```typescript
isStableAttribute('data-category', 'electronics') // → true (generic data-*)
isStableAttribute('data-action', 'click')         // → true (generic data-*)
```

**After (v1.4.0):**
```typescript
isStableAttribute('data-category', 'electronics') // → false (GA attribute)
isStableAttribute('data-action', 'click')         // → false (GA attribute)
```

**Impact**: Use semantic alternatives: `data-product-category`, `data-action-type`, etc.

## Regression Testing Strategy

### Critical Existing Tests to Verify

1. **Attribute Filtering Tests**: Run full suite in `attribute-filtering.test.ts`
2. **Generator Tests**: Verify EID generation still works correctly
3. **Resolver Tests**: Verify resolution doesn't break with reduced attributes
4. **Semantic Extractor Tests**: Verify attribute extraction flow unchanged

### Regression Checklist

- [ ] All existing tests pass (except those being intentionally updated)
- [ ] No performance degradation (should be negligible)
- [ ] Cache behavior unchanged (attributes are cached correctly)
- [ ] Test attributes (`data-testid`, etc.) still work correctly
- [ ] Generic `data-*` attributes (non-analytics) still allowed
- [ ] `-id` suffix rule still works for non-analytics attributes

## Verification Steps

### After Implementation

1. **Run full test suite:**
   ```bash
   yarn test
   ```
   Expected: All tests pass (some updated expectations)

2. **Run specific test files:**
   ```bash
   yarn vitest run tests/unit/attribute-filtering.test.ts
   yarn vitest run tests/integration/generator-attribute-filtering.test.ts
   ```

3. **Manual verification:**
   - Create test HTML with analytics attributes
   - Generate EID and verify analytics attributes excluded
   - Verify resolution still works correctly
   - Check that test attributes are preserved

4. **Performance check:**
   - No significant performance impact expected
   - Pattern matching adds ~28 prefix checks (O(n) where n=28)
   - Total execution time increase: <1%

## Implementation Checklist

### Phase 1: Core Implementation
- [ ] Add `ANALYTICS_DATA_PREFIXES` constant (28 patterns)
- [ ] Add `ANALYTICS_EXACT_ATTRIBUTES` constant (4 patterns)
- [ ] Insert analytics filtering logic after line 157 in `isStableAttribute()`
- [ ] Verify logic order: test IDs → analytics → `-id` suffix

### Phase 2: Unit Tests
- [ ] Add `describe('Analytics attribute filtering')` with 7 sub-sections
- [ ] Add ~50 test cases covering all categories
- [ ] Add edge case tests for `-id` conflicts
- [ ] Update breaking test expectations

### Phase 3: Integration Tests
- [ ] Add 5 integration test scenarios
- [ ] Test realistic combinations
- [ ] Test resolution stability

### Phase 4: Documentation
- [ ] Update `attribute-filtering.md` with analytics section
- [ ] Add edge cases and migration guide
- [ ] Update `CHANGELOG.md` with version 1.4.0
- [ ] Document breaking changes clearly

### Phase 5: Regression Testing
- [ ] Run full test suite
- [ ] Verify no unexpected failures
- [ ] Check performance (should be negligible impact)
- [ ] Manual smoke testing

## Expected Outcome

After implementation:
- ✅ 28 analytics prefix patterns filtered
- ✅ 4 exact-match analytics attributes filtered
- ✅ ~50 new unit tests passing
- ✅ 5 new integration tests passing
- ✅ All existing tests pass (with updated expectations)
- ✅ Documentation comprehensive and up-to-date
- ✅ Breaking changes clearly documented with migration path
- ✅ No performance degradation
- ✅ Test attributes remain protected

## Timeline Estimate

- Core implementation: 30 minutes
- Unit tests: 60 minutes
- Integration tests: 30 minutes
- Documentation: 30 minutes
- Testing & verification: 20 minutes
- **Total: ~2.5-3 hours**
