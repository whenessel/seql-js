import type { ElementIdentity, ElementSemantics } from '../types';
import type { AnchorResult } from '../generator/anchor-finder';

/**
 * LRU Cache implementation for selector results
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of EID cache hits */
  eidHits: number;
  /** Total number of EID cache misses */
  eidMisses: number;
  /** Total number of selector cache hits */
  selectorHits: number;
  /** Total number of selector cache misses */
  selectorMisses: number;
  /** Total number of anchor cache hits */
  anchorHits: number;
  /** Total number of anchor cache misses */
  anchorMisses: number;
  /** Total number of semantics cache hits */
  semanticsHits: number;
  /** Total number of semantics cache misses */
  semanticsMisses: number;
  /** Current selector cache size */
  selectorCacheSize: number;
  /** Maximum selector cache size */
  maxSelectorCacheSize: number;
}

/**
 * Options for creating an EID cache
 */
export interface EIDCacheOptions {
  /** Maximum size for selector cache (default: 1000) */
  maxSelectorCacheSize?: number;
}

/**
 * EID Cache for multi-level caching
 * Provides caching for:
 * - Complete EID identities (WeakMap)
 * - Selector query results (LRU Map)
 * - Anchor finder results (WeakMap)
 * - Semantic extraction results (WeakMap)
 */
export class EIDCache {
  private eidCache: WeakMap<Element, ElementIdentity>;
  private selectorResultCache: LRUCache<string, Element[]>;
  private anchorCache: WeakMap<Element, AnchorResult | null>;
  private semanticsCache: WeakMap<Element, ElementSemantics>;
  private stats: CacheStats;

  constructor(options: EIDCacheOptions = {}) {
    this.eidCache = new WeakMap();
    this.selectorResultCache = new LRUCache<string, Element[]>(
      options.maxSelectorCacheSize ?? 1000,
    );
    this.anchorCache = new WeakMap();
    this.semanticsCache = new WeakMap();
    this.stats = {
      eidHits: 0,
      eidMisses: 0,
      selectorHits: 0,
      selectorMisses: 0,
      anchorHits: 0,
      anchorMisses: 0,
      semanticsHits: 0,
      semanticsMisses: 0,
      selectorCacheSize: 0,
      maxSelectorCacheSize: options.maxSelectorCacheSize ?? 1000,
    };
  }

  /**
   * Get cached EID for element
   */
  getEID(element: Element): ElementIdentity | undefined {
    const cached = this.eidCache.get(element);
    if (cached !== undefined) {
      this.stats.eidHits++;
      return cached;
    }
    this.stats.eidMisses++;
    return undefined;
  }

  /**
   * Cache EID for element
   */
  setEID(element: Element, eid: ElementIdentity): void {
    this.eidCache.set(element, eid);
  }

  /**
   * Get cached selector results
   */
  getSelectorResults(selector: string): Element[] | undefined {
    const cached = this.selectorResultCache.get(selector);
    if (cached !== undefined) {
      this.stats.selectorHits++;
      this.stats.selectorCacheSize = this.selectorResultCache.size;
      return cached;
    }
    this.stats.selectorMisses++;
    this.stats.selectorCacheSize = this.selectorResultCache.size;
    return undefined;
  }

  /**
   * Cache selector results
   */
  setSelectorResults(selector: string, results: Element[]): void {
    this.selectorResultCache.set(selector, results);
    this.stats.selectorCacheSize = this.selectorResultCache.size;
  }

  /**
   * Get cached anchor result
   */
  getAnchor(element: Element): AnchorResult | null | undefined {
    if (this.anchorCache.has(element)) {
      this.stats.anchorHits++;
      return this.anchorCache.get(element);
    }
    this.stats.anchorMisses++;
    return undefined;
  }

  /**
   * Cache anchor result
   */
  setAnchor(element: Element, result: AnchorResult | null): void {
    this.anchorCache.set(element, result);
  }

  /**
   * Get cached semantics
   */
  getSemantics(element: Element): ElementSemantics | undefined {
    const cached = this.semanticsCache.get(element);
    if (cached !== undefined) {
      this.stats.semanticsHits++;
      return cached;
    }
    this.stats.semanticsMisses++;
    return undefined;
  }

  /**
   * Cache semantics
   */
  setSemantics(element: Element, semantics: ElementSemantics): void {
    this.semanticsCache.set(element, semantics);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.selectorResultCache.clear();
    this.stats.selectorCacheSize = 0;
    // WeakMaps are automatically cleared when elements are GC'd
    // Reset stats
    this.stats = {
      eidHits: 0,
      eidMisses: 0,
      selectorHits: 0,
      selectorMisses: 0,
      anchorHits: 0,
      anchorMisses: 0,
      semanticsHits: 0,
      semanticsMisses: 0,
      selectorCacheSize: 0,
      maxSelectorCacheSize: this.stats.maxSelectorCacheSize,
    };
  }

  /**
   * Invalidate cache for a specific element
   * Note: WeakMaps don't support deletion, but we can clear selector cache
   * if needed. This method is mainly for future extensibility.
   */
  invalidateElement(_element: Element): void {
    // WeakMaps don't support explicit deletion
    // Elements will be automatically removed when GC'd
    // We can only clear selector cache entries that might reference this element
    // For now, this is a no-op, but kept for API consistency
  }

  /**
   * Invalidate a specific selector from cache
   */
  invalidateSelector(selector: string): void {
    this.selectorResultCache.delete(selector);
    this.stats.selectorCacheSize = this.selectorResultCache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      selectorCacheSize: this.selectorResultCache.size,
    };
  }

  /**
   * Get cache hit rate for EID cache
   */
  getEIDHitRate(): number {
    const total = this.stats.eidHits + this.stats.eidMisses;
    return total > 0 ? this.stats.eidHits / total : 0;
  }

  /**
   * Get cache hit rate for selector cache
   */
  getSelectorHitRate(): number {
    const total = this.stats.selectorHits + this.stats.selectorMisses;
    return total > 0 ? this.stats.selectorHits / total : 0;
  }

  /**
   * Get cache hit rate for anchor cache
   */
  getAnchorHitRate(): number {
    const total = this.stats.anchorHits + this.stats.anchorMisses;
    return total > 0 ? this.stats.anchorHits / total : 0;
  }

  /**
   * Get cache hit rate for semantics cache
   */
  getSemanticsHitRate(): number {
    const total = this.stats.semanticsHits + this.stats.semanticsMisses;
    return total > 0 ? this.stats.semanticsHits / total : 0;
  }

  /**
   * Get overall cache hit rate
   */
  getOverallHitRate(): number {
    const totalHits =
      this.stats.eidHits +
      this.stats.selectorHits +
      this.stats.anchorHits +
      this.stats.semanticsHits;
    const totalMisses =
      this.stats.eidMisses +
      this.stats.selectorMisses +
      this.stats.anchorMisses +
      this.stats.semanticsMisses;
    const total = totalHits + totalMisses;
    return total > 0 ? totalHits / total : 0;
  }
}

/**
 * Create a new EID cache instance
 */
export function createEIDCache(options?: EIDCacheOptions): EIDCache {
  return new EIDCache(options);
}

/**
 * Global default cache instance
 * Used automatically if no cache is provided to generateEID
 */
let globalCache: EIDCache | null = null;

/**
 * Get or create the global default cache
 */
export function getGlobalCache(): EIDCache {
  if (!globalCache) {
    globalCache = createEIDCache();
  }
  return globalCache;
}

/**
 * Reset the global cache
 */
export function resetGlobalCache(): void {
  globalCache = null;
}
