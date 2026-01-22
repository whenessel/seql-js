# Batch Processing Guide

Efficiently process multiple elements.

## When to Use Batch

- Processing 10+ elements
- Initial page load analysis
- Bulk export/import

## Basic Usage

```typescript
import { generateEIDBatch } from 'seql-js';

const elements = Array.from(document.querySelectorAll('button'));
const eids = generateEIDBatch(elements);

console.log(`Generated ${eids.filter(e => e).length}/${elements.length} EIDs`);
```

## With Options

```typescript
generateEIDBatch(elements, {
  maxPathDepth: 5,
  enableSvgFingerprint: false
});
```

## Performance

Batch processing is 30-50% faster than individual calls for 10+ elements.

## Chunking for Large DOMs

```typescript
async function processLarge(elements: Element[], chunkSize = 100) {
  const allEIDs = [];

  for (let i = 0; i < elements.length; i += chunkSize) {
    const chunk = elements.slice(i, i + chunkSize);
    const chunkEIDs = generateEIDBatch(chunk);
    allEIDs.push(...chunkEIDs);

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return allEIDs;
}
```
