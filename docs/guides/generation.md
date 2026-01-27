# Generation Guide

Deep dive on generating Element Identity Descriptors.

## Basic Generation

```typescript
import { generateEID } from 'seql-js';

const element = document.querySelector('button');
const eid = generateEID(element);
```

## Options

### Max Path Depth

Control how far the path extends:

```typescript
generateEID(element, { maxPathDepth: 5 }); // Shorter paths
```

### Confidence Threshold

**Since v1.3.0**: Default is `0.0` (always generate EID). Set explicit threshold to filter low-confidence:

```typescript
// v1.3.0+ default: Always returns EID
const eid = generateEID(element); // confidence threshold: 0.0

// Explicit filtering for high-quality only
const eid = generateEID(element, { confidenceThreshold: 0.3 }); // May return null
```

### SVG Fingerprinting

Control SVG processing:

```typescript
generateEID(element, { enableSvgFingerprint: false }); // Skip SVG
```

## Understanding Results

```typescript
const eid = generateEID(element);

if (!eid) {
  // v1.3.0+: Only happens for invalid elements (disconnected, null, etc.)
  console.warn('Invalid element - cannot generate EID');
} else {
  console.log('Confidence:', eid.meta.confidence);
  console.log('Degraded:', eid.meta.degraded);
  
  // Check confidence quality (v1.3.0+)
  if (eid.meta.confidence < 0.3) {
    console.warn('Low confidence - element has minimal semantics');
  }

  if (eid.meta.degraded) {
    console.warn('Reason:', eid.meta.degradationReason);
  }
}
```

## Best Practices

1. Check for null return value
2. Monitor confidence scores
3. Use custom cache for isolated features
4. Batch process when generating many EIDs
