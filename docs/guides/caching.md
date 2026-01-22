# Caching Guide

Optimize performance with caching.

## Global Cache (Default)

Automatically used:

```typescript
import { generateEID } from 'seql-js';

const eid = generateEID(element);  // Uses global cache
```

## Custom Cache

Create isolated cache:

```typescript
import { createEIDCache, generateEID } from 'seql-js';

const cache = createEIDCache({ maxSize: 500 });

generateEID(element, { cache });
```

## Monitoring

```typescript
import { getGlobalCache } from 'seql-js';

const stats = getGlobalCache().getStats();
console.log('Hit rate:', stats.hitRate);
console.log('Size:', stats.size);
```

## Clearing

```typescript
getGlobalCache().clear();  // Clear all cached data
```

## Best Practices

1. Use global cache for general use
2. Create custom cache for isolated features
3. Clear cache on major DOM changes
4. Monitor hit rate in development
