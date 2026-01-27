# Migration Guide: v1.2.0 → v1.3.0

This guide helps you migrate from seql-js v1.2.0 to v1.3.0.

## Breaking Changes

### 1. `generateEID` Always Returns EID for Valid Elements

**What Changed**: Default `confidenceThreshold` reduced from `0.1` to `0.0`.

**v1.2.0 Behavior**:

```typescript
const element = document.querySelector('.minimal-div');
const eid = generateEID(element);

if (!eid) {
  console.log('Element has low semantic quality');
  // null returned for confidence < 0.1
}
```

**v1.3.0 Behavior**:

```typescript
const element = document.querySelector('.minimal-div');
const eid = generateEID(element);

// EID is always returned (unless element is invalid)
if (eid && eid.meta.confidence < 0.1) {
  console.log('Element has low semantic quality');
}
```

### Migration Strategies

#### Strategy 1: Check `meta.confidence` Manually

Recommended if you want to handle low-confidence cases gracefully:

```typescript
// Old code (v1.2.0)
const eid = generateEID(element);
if (!eid) {
  // Handle low quality
  return fallbackIdentification(element);
}
processEID(eid);

// New code (v1.3.0)
const eid = generateEID(element);
if (!eid) {
  // Only happens for invalid elements now
  throw new Error('Invalid element');
}

if (eid.meta.confidence < 0.1) {
  // Handle low quality
  return fallbackIdentification(element);
}
processEID(eid);
```

#### Strategy 2: Restore Old Behavior with Explicit Threshold

If you want identical v1.2.0 behavior:

```typescript
// Restore v1.2.0 behavior exactly
const eid = generateEID(element, { confidenceThreshold: 0.1 });

if (!eid) {
  // Element has confidence < 0.1 (same as v1.2.0)
  return fallbackIdentification(element);
}
```

#### Strategy 3: Use Low-Confidence EIDs

Embrace the new behavior and use all generated EIDs:

```typescript
const eid = generateEID(element);

if (!eid) {
  throw new Error('Invalid element');
}

// Use EID regardless of confidence
// Low confidence is acceptable for your use case
analytics.track('click', { selector: stringifySEQL(eid) });

// Optional: Add confidence metadata
if (eid.meta.confidence < 0.3) {
  analytics.track('low_confidence_element', {
    selector: stringifySEQL(eid),
    confidence: eid.meta.confidence,
  });
}
```

## Non-Breaking Changes

### 2. Improved Anchor Scoring for Stable IDs

**What Changed**: `ANCHOR_SCORE.STABLE_ID` increased from `0.1` to `0.25`.

**Impact**: Elements with stable IDs (`#root`, `#app`, `#main`, etc.) now receive higher confidence scores.

**Example**:

```typescript
// Element: <div id="root"><div class="container">...</div></div>

// v1.2.0: confidence ≈ 0.09 (might return null with default threshold)
// v1.3.0: confidence ≈ 0.35 (always generates EID)
```

**Action Required**: None - this is a quality improvement. Your code will automatically benefit from more accurate confidence scores.

## Updated API Signatures

No signature changes - all APIs remain backward compatible. Only default values changed:

```typescript
// v1.2.0
interface GeneratorOptions {
  confidenceThreshold?: number; // default: 0.1
}

// v1.3.0
interface GeneratorOptions {
  confidenceThreshold?: number; // default: 0.0
}
```

## Testing Your Migration

### Test Cases to Verify

1. **Elements that previously returned `null`**:

```typescript
// Find elements that would have returned null in v1.2.0
const testElements = document.querySelectorAll('div, span');

testElements.forEach((el) => {
  const eid = generateEID(el, { confidenceThreshold: 0.1 }); // v1.2.0 behavior

  if (!eid) {
    // This element would have returned null in v1.2.0
    const newEid = generateEID(el); // v1.3.0 behavior
    console.log('Now generates EID with confidence:', newEid?.meta.confidence);
  }
});
```

1. **Verify confidence distribution**:

```typescript
const allElements = document.querySelectorAll('*');
const confidences = [];

allElements.forEach((el) => {
  const eid = generateEID(el);
  if (eid) {
    confidences.push(eid.meta.confidence);
  }
});

console.log('Confidence distribution:', {
  min: Math.min(...confidences),
  max: Math.max(...confidences),
  avg: confidences.reduce((a, b) => a + b, 0) / confidences.length,
});
```

## Rollback Plan

If you need to rollback to v1.2.0 behavior without downgrading:

```typescript
// Create a wrapper that mimics v1.2.0 exactly
function generateEID_v1_2_0(element, options = {}) {
  // Force v1.2.0 default threshold
  const v1_2_options = {
    ...options,
    confidenceThreshold: options.confidenceThreshold ?? 0.1,
  };

  return generateEID(element, v1_2_options);
}

// Use wrapper in your codebase
const eid = generateEID_v1_2_0(element);
if (!eid) {
  // Same behavior as v1.2.0
}
```

## Common Migration Patterns

### Pattern 1: Analytics Tracking

**Before (v1.2.0)**:

```typescript
function trackElement(element) {
  const eid = generateEID(element);

  if (!eid) {
    // Skip tracking for low-quality elements
    return;
  }

  analytics.track('click', { selector: stringifySEQL(eid) });
}
```

**After (v1.3.0)** - Option A (track everything):

```typescript
function trackElement(element) {
  const eid = generateEID(element);

  if (!eid) {
    // Invalid element
    return;
  }

  // Track with confidence metadata
  analytics.track('click', {
    selector: stringifySEQL(eid),
    confidence: eid.meta.confidence,
  });
}
```

**After (v1.3.0)** - Option B (maintain filtering):

```typescript
function trackElement(element) {
  const eid = generateEID(element, { confidenceThreshold: 0.1 });

  if (!eid) {
    // Low quality - skip tracking (same as v1.2.0)
    return;
  }

  analytics.track('click', { selector: stringifySEQL(eid) });
}
```

### Pattern 2: Session Replay

**Before (v1.2.0)**:

```typescript
function captureInteraction(event) {
  const eid = generateEID(event.target);

  if (!eid) {
    // Fall back to CSS selector
    return { selector: getCssPath(event.target), type: 'css' };
  }

  return { selector: stringifySEQL(eid), type: 'seql' };
}
```

**After (v1.3.0)**:

```typescript
function captureInteraction(event) {
  const eid = generateEID(event.target);

  if (!eid) {
    // Invalid element (disconnected, etc.)
    return null;
  }

  // Always use SEQL, add quality flag
  return {
    selector: stringifySEQL(eid),
    type: 'seql',
    quality: eid.meta.confidence >= 0.3 ? 'high' : 'low',
  };
}
```

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/whenessel/seql-js/issues)
- **Discussions**: [GitHub Discussions](https://github.com/whenessel/seql-js/discussions)
- **Documentation**: [Full Docs](../README.md)

## Version History

- **v1.3.0** (2026-01-27): Always-generate guarantee + improved stable ID scoring
- **v1.2.0** (2026-01-26): Previous stable release
- **v1.1.0** (2026-01-22): nth-child positioning
- **v1.0.3** (2026-01-21): Attribute stability filtering
