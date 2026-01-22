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

Set minimum quality:

```typescript
generateEID(element, { confidenceThreshold: 0.3 }); // Higher quality only
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
  // Generation failed - element lacks semantics or not connected
  console.warn('Cannot generate EID');
} else {
  console.log('Confidence:', eid.meta.confidence);
  console.log('Degraded:', eid.meta.degraded);

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
