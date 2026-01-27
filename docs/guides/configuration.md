# Configuration Guide

Customizing SEQL behavior.

## Generator Options

```typescript
interface GeneratorOptions {
  maxPathDepth?: number; // Default: 10
  enableSvgFingerprint?: boolean; // Default: true
  confidenceThreshold?: number; // Default: 0.0 (v1.3.0+)
  fallbackToBody?: boolean; // Default: true
  cache?: EIDCache; // Default: global cache
}
```

### Confidence Threshold (v1.3.0 Change)

**Since v1.3.0**: Default `confidenceThreshold` is `0.0`, meaning `generateEID` always returns an EID for valid DOM elements.

- **v1.3.0+**: Returns EID with low confidence indicated via `meta.confidence` field
- **v1.2.0 and earlier**: Returned `null` for elements below threshold `0.1`

**Migration**: If your code relies on `null` returns to filter low-quality EIDs:

```typescript
// Old behavior (v1.2.0)
const eid = generateEID(element); // null if confidence < 0.1

// New behavior (v1.3.0+) - check confidence manually
const eid = generateEID(element); // always returns EID
if (eid && eid.meta.confidence < 0.1) {
  // Handle low-confidence case
}

// OR restore old behavior with explicit threshold
const eid = generateEID(element, { confidenceThreshold: 0.1 });
```

## Resolver Options

```typescript
interface ResolverOptions {
  strictMode?: boolean; // Default: false
  requireUniqueness?: boolean; // Default: false
  enableFallback?: boolean; // Default: true
  maxCandidates?: number; // Default: 100
}
```

## Stringify Options

```typescript
interface StringifyOptions {
  verbose?: boolean; // Default: false
  includeNthChild?: boolean; // Default: true
}
```

## Example Configurations

### High Quality Only

Filter for only high-confidence EIDs:

```typescript
generateEID(element, {
  maxPathDepth: 15,
  confidenceThreshold: 0.5, // Only return EIDs with confidence >= 0.5
});
```

### Performance Optimized

```typescript
generateEID(element, {
  maxPathDepth: 5,
  enableSvgFingerprint: false,
});
```

### Strict Resolution

```typescript
resolve(eid, document, {
  strictMode: true,
  requireUniqueness: true,
  enableFallback: false,
});
```
