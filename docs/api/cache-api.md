# Cache API

Performance optimization through intelligent caching of EID generation and resolution results.

## Overview

SEQL uses multi-level caching to avoid redundant computation:

- **Level 1**: EID cache (WeakMap) - Full EID objects keyed by DOM element
- **Level 2**: Selector query cache (LRU) - CSS selector query results
- **Level 3**: Anchor cache (WeakMap) - Anchor finding results
- **Level 4**: Semantics cache (WeakMap) - Semantic extraction results

All caching is automatic and transparent to users.

## createEIDCache()

Creates a new cache instance with custom configuration.

### Signature

```typescript
function createEIDCache(options?: CacheOptions): EIDCache;
```

### Parameters

| Parameter | Type           | Required | Description                 |
| --------- | -------------- | -------- | --------------------------- |
| `options` | `CacheOptions` | No       | Cache configuration options |

### Cache Options

```typescript
interface CacheOptions {
  maxSize?: number; // Max entries in LRU cache (default: 1000)
  enableStats?: boolean; // Track cache statistics (default: true)
}
```

### Returns

- **`EIDCache`** - New cache instance

### Examples

#### Create Custom Cache

```typescript
import { createEIDCache } from 'seql-js';

// Create cache with custom size
const cache = createEIDCache({ maxSize: 500 });

console.log('Cache created');
```

#### Use with Generation

```typescript
import { generateEID, createEIDCache } from 'seql-js';

// Create dedicated cache for session
const sessionCache = createEIDCache({ maxSize: 2000 });

const button = document.querySelector('button');
const eid = generateEID(button, {
  cache: sessionCache,
});

// Subsequent calls use cached result
const eid2 = generateEID(button, {
  cache: sessionCache, // Instant return from cache
});
```

#### Per-Page Cache

```typescript
import { createEIDCache, generateEIDBatch } from 'seql-js';

class PageAnalyzer {
  private cache: EIDCache;

  constructor() {
    this.cache = createEIDCache({ maxSize: 1000 });
  }

  analyzeElements(selector: string) {
    const elements = Array.from(document.querySelectorAll(selector));
    return generateEIDBatch(elements, {
      cache: this.cache,
    });
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    this.cache.clear();
  }
}

const analyzer = new PageAnalyzer();
const eids = analyzer.analyzeElements('button, a, input');
console.log('Cache stats:', analyzer.getCacheStats());
```

---

## getGlobalCache()

Returns the singleton global cache instance used by default.

### Signature

```typescript
function getGlobalCache(): EIDCache;
```

### Returns

- **`EIDCache`** - Global cache instance

### Examples

#### Access Global Cache

```typescript
import { getGlobalCache } from 'seql-js';

const globalCache = getGlobalCache();
console.log('Global cache stats:', globalCache.getStats());
```

#### Monitor Cache Performance

```typescript
import { getGlobalCache, generateEID } from 'seql-js';

const cache = getGlobalCache();

// Before
const statsBefore = cache.getStats();

// Generate EIDs
const buttons = document.querySelectorAll('button');
buttons.forEach((btn) => generateEID(btn));

// After
const statsAfter = cache.getStats();

console.log('Hit rate:', statsAfter.hitRate);
console.log('New entries:', statsAfter.size - statsBefore.size);
```

#### Clear Global Cache

```typescript
import { getGlobalCache } from 'seql-js';

// Clear all cached data
getGlobalCache().clear();
console.log('Global cache cleared');
```

---

## EIDCache Interface

The `EIDCache` interface provides methods for cache management and statistics.

### Methods

#### getEID()

```typescript
getEID(element: Element): ElementIdentity | null | undefined
```

Retrieve cached EID for an element.

- Returns `ElementIdentity` if cached
- Returns `undefined` if not in cache
- Returns `null` if previously failed to generate

#### setEID()

```typescript
setEID(element: Element, eid: ElementIdentity | null): void
```

Store EID in cache.

#### getSelectorResults()

```typescript
getSelectorResults(selector: string): Element[] | undefined
```

Retrieve cached CSS selector query results.

#### setSelectorResults()

```typescript
setSelectorResults(selector: string, elements: Element[]): void
```

Store CSS selector query results.

#### getAnchor()

```typescript
getAnchor(element: Element): AnchorResult | undefined
```

Retrieve cached anchor finding result.

#### setAnchor()

```typescript
setAnchor(element: Element, result: AnchorResult): void
```

Store anchor finding result.

#### getSemantics()

```typescript
getSemantics(element: Element): ElementSemantics | undefined
```

Retrieve cached semantic extraction result.

#### setSemantics()

```typescript
setSemantics(element: Element, semantics: ElementSemantics): void
```

Store semantic extraction result.

#### getStats()

```typescript
getStats(): CacheStats
```

Get cache statistics.

Returns:

```typescript
interface CacheStats {
  size: number; // Current cache size
  hits: number; // Cache hit count
  misses: number; // Cache miss count
  hitRate: number; // Hit rate (0-1)
  evictions: number; // Number of evicted entries
}
```

#### clear()

```typescript
clear(): void
```

Clear all cached data.

---

## Cache Strategies

### Strategy 1: Global Cache (Default)

Use the global cache for general-purpose caching:

```typescript
import { generateEID } from 'seql-js';

// Uses global cache automatically
const eid = generateEID(element);
```

**Pros:**

- Zero configuration
- Shared across entire application
- Good for general use

**Cons:**

- Shared state may not suit all scenarios
- No isolation between features

### Strategy 2: Custom Cache Per Feature

Create dedicated caches for different features:

```typescript
import { createEIDCache, generateEID } from 'seql-js';

class FeatureA {
  private cache = createEIDCache({ maxSize: 500 });

  trackElement(el: Element) {
    return generateEID(el, { cache: this.cache });
  }
}

class FeatureB {
  private cache = createEIDCache({ maxSize: 300 });

  analyzeElement(el: Element) {
    return generateEID(el, { cache: this.cache });
  }
}
```

**Pros:**

- Isolated state per feature
- Custom cache sizes
- Easy to clear feature-specific cache

**Cons:**

- More memory usage
- Less cache sharing

### Strategy 3: Session-Based Cache

Clear cache on navigation or session end:

```typescript
import { createEIDCache } from 'seql-js';

class SessionManager {
  private cache = createEIDCache({ maxSize: 1000 });

  onNavigate() {
    this.cache.clear();
    console.log('Cache cleared for new page');
  }

  getCache() {
    return this.cache;
  }
}

const session = new SessionManager();

// Clear on navigation
window.addEventListener('beforeunload', () => {
  session.onNavigate();
});
```

**Pros:**

- Fresh cache per page/session
- Prevents stale data
- Predictable behavior

**Cons:**

- Lose cross-page caching benefits
- More computation on each page

---

## Performance Impact

### Cache Hit Rates

Typical hit rates in production scenarios:

| Scenario        | Hit Rate | Impact |
| --------------- | -------- | ------ |
| Static page     | 60-80%   | High   |
| Single-page app | 40-60%   | Medium |
| Dynamic content | 20-40%   | Low    |
| First page load | 0-10%    | None   |

### Performance Metrics

With cache (1000 elements, 50% hit rate):

| Operation      | Without Cache | With Cache | Improvement |
| -------------- | ------------- | ---------- | ----------- |
| EID generation | 1500ms        | 800ms      | 47% faster  |
| Selector query | 300ms         | 150ms      | 50% faster  |
| Anchor finding | 500ms         | 250ms      | 50% faster  |

### Memory Usage

Typical memory footprint:

| Cache Size   | Memory Usage |
| ------------ | ------------ |
| 100 entries  | ~1 MB        |
| 500 entries  | ~5 MB        |
| 1000 entries | ~10 MB       |
| 5000 entries | ~50 MB       |

---

## Best Practices

### ✅ Do

#### Use global cache for most cases

```typescript
import { generateEID } from 'seql-js';
const eid = generateEID(element); // Uses global cache
```

#### Monitor cache performance

```typescript
import { getGlobalCache } from 'seql-js';

setInterval(() => {
  const stats = getGlobalCache().getStats();
  if (stats.hitRate < 0.3) {
    console.warn('Low cache hit rate:', stats.hitRate);
  }
}, 60000); // Check every minute
```

#### Clear cache on major DOM changes

```typescript
import { getGlobalCache } from 'seql-js';

function onMajorDOMChange() {
  getGlobalCache().clear();
  console.log('Cache cleared after DOM restructure');
}
```

#### Use custom cache for isolated features

```typescript
import { createEIDCache } from 'seql-js';

class IsolatedFeature {
  private cache = createEIDCache({ maxSize: 200 });
  // Use this.cache for all operations
}
```

### ❌ Don't

#### Don't create cache per element

```typescript
// ❌ Bad: Creates new cache for each element
elements.forEach((el) => {
  const cache = createEIDCache();
  generateEID(el, { cache });
});

// ✅ Good: Reuse cache
const cache = createEIDCache();
elements.forEach((el) => {
  generateEID(el, { cache });
});
```

#### Don't set maxSize too high

```typescript
// ❌ Bad: Excessive memory usage
const cache = createEIDCache({ maxSize: 100000 });

// ✅ Good: Reasonable limit
const cache = createEIDCache({ maxSize: 1000 });
```

#### Don't clear cache too frequently

```typescript
// ❌ Bad: Cache becomes useless
setInterval(() => cache.clear(), 1000);

// ✅ Good: Clear only when needed
window.addEventListener('popstate', () => cache.clear());
```

---

## Debugging Cache Issues

### Check Cache Stats

```typescript
import { getGlobalCache } from 'seql-js';

const stats = getGlobalCache().getStats();
console.log('Cache stats:', {
  size: stats.size,
  hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
  hits: stats.hits,
  misses: stats.misses,
  evictions: stats.evictions,
});
```

### Monitor Cache Growth

```typescript
import { getGlobalCache } from 'seql-js';

let previousSize = 0;
setInterval(() => {
  const currentSize = getGlobalCache().getStats().size;
  const growth = currentSize - previousSize;

  if (growth > 100) {
    console.warn(`Cache grew by ${growth} entries in last minute`);
  }

  previousSize = currentSize;
}, 60000);
```

### Test Cache Effectiveness

```typescript
import { getGlobalCache, generateEID } from 'seql-js';

function testCacheEffectiveness(element: Element, iterations = 1000) {
  getGlobalCache().clear();

  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    generateEID(element);
  }

  const end = performance.now();
  const stats = getGlobalCache().getStats();

  console.log(`${iterations} iterations: ${(end - start).toFixed(2)}ms`);
  console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  console.log(`Cache size: ${stats.size}`);
}

const button = document.querySelector('button')!;
testCacheEffectiveness(button);
```

---

## Advanced Patterns

### Cache Warming

Pre-populate cache on page load:

```typescript
import { generateEIDBatch, createEIDCache } from 'seql-js';

async function warmCache() {
  const cache = createEIDCache({ maxSize: 1000 });

  // Generate EIDs for all important elements
  const importantElements = Array.from(document.querySelectorAll('[data-track], button, a, input'));

  const eids = generateEIDBatch(importantElements, { cache });

  console.log(`Cache warmed with ${eids.filter((e) => e).length} entries`);
  return cache;
}

// Warm cache when page is idle
requestIdleCallback(() => warmCache());
```

### Cache Persistence

Save/restore cache across page loads:

```typescript
import { getGlobalCache, createEIDCache } from 'seql-js';

// Note: This is a simplified example. In production, you'd need
// to serialize/deserialize EIDs and handle cache invalidation

function saveCache() {
  const stats = getGlobalCache().getStats();
  localStorage.setItem('cache-stats', JSON.stringify(stats));
}

function loadCache() {
  const stats = localStorage.getItem('cache-stats');
  if (stats) {
    console.log('Previous session stats:', JSON.parse(stats));
  }
}

window.addEventListener('beforeunload', saveCache);
window.addEventListener('load', loadCache);
```

---

## Next Steps

- [Core Functions](./core-functions.md) - EID generation and resolution
- [Batch API](./batch-api.md) - Batch processing
- [Performance Guide](../troubleshooting/performance.md) - Optimization tips
- [Examples](../examples/) - Real-world usage patterns
