import { describe, it, expect, beforeEach } from 'vitest';
import { EIDCache, createEIDCache, getGlobalCache, resetGlobalCache } from '../../src/utils/eid-cache';
import type { ElementIdentity } from '../../src/types';
import type { AnchorResult } from '../../src/generator/anchor-finder';
import type { ElementSemantics } from '../../src/types';

describe('EIDCache', () => {
  let doc: Document;
  let cache: EIDCache;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Test');
    cache = createEIDCache({ maxSelectorCacheSize: 10 });
  });

  describe('DSL caching', () => {
    it('should cache and retrieve DSL for element', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const dsl: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'body',
          semantics: {},
          score: 0.3,
          degraded: true,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: { id: 'test-button' },
          score: 0.5,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 3,
        },
        meta: {
          confidence: 0.5,
          generatedAt: new Date().toISOString(),
          generator: 'dom-dsl@1.0',
          source: 'test',
          degraded: false,
        },
      };

      // Cache miss initially
      expect(cache.getEID(button)).toBeUndefined();

      // Set and retrieve
      cache.setEID(button, dsl);
      const cached = cache.getEID(button);

      expect(cached).toBeDefined();
      expect(cached).toEqual(dsl);
    });

    it('should track cache hits and misses', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      const dsl: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'body',
          semantics: {},
          score: 0.3,
          degraded: true,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.5,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 3,
        },
        meta: {
          confidence: 0.5,
          generatedAt: new Date().toISOString(),
          generator: 'dom-dsl@1.0',
          source: 'test',
          degraded: false,
        },
      };

      // Miss
      cache.getEID(button);
      const stats1 = cache.getStats();
      expect(stats1.eidMisses).toBe(1);
      expect(stats1.eidHits).toBe(0);

      // Set and hit
      cache.setEID(button, dsl);
      cache.getEID(button);
      const stats2 = cache.getStats();
      expect(stats2.eidHits).toBe(1);
      expect(stats2.eidMisses).toBe(1);
    });
  });

  describe('Selector cache (LRU)', () => {
    it('should cache selector results', () => {
      const button1 = doc.createElement('button');
      button1.id = 'btn1';
      const button2 = doc.createElement('button');
      button2.id = 'btn2';
      doc.body.appendChild(button1);
      doc.body.appendChild(button2);

      const selector = 'button';
      const results = [button1, button2];

      // Cache miss
      expect(cache.getSelectorResults(selector)).toBeUndefined();

      // Set and retrieve
      cache.setSelectorResults(selector, results);
      const cached = cache.getSelectorResults(selector);

      expect(cached).toBeDefined();
      expect(cached).toEqual(results);
    });

    it('should evict oldest entries when limit exceeded (LRU)', () => {
      const smallCache = createEIDCache({ maxSelectorCacheSize: 3 });

      // Add 3 entries
      smallCache.setSelectorResults('selector1', [doc.createElement('div')]);
      smallCache.setSelectorResults('selector2', [doc.createElement('div')]);
      smallCache.setSelectorResults('selector3', [doc.createElement('div')]);

      expect(smallCache.getStats().selectorCacheSize).toBe(3);

      // Add 4th entry - should evict first
      smallCache.setSelectorResults('selector4', [doc.createElement('div')]);

      expect(smallCache.getStats().selectorCacheSize).toBe(3);
      expect(smallCache.getSelectorResults('selector1')).toBeUndefined(); // Evicted
      expect(smallCache.getSelectorResults('selector4')).toBeDefined(); // Still there
    });

    it('should move accessed entries to end (LRU)', () => {
      const smallCache = createEIDCache({ maxSelectorCacheSize: 3 });

      // Add 3 entries
      smallCache.setSelectorResults('selector1', [doc.createElement('div')]);
      smallCache.setSelectorResults('selector2', [doc.createElement('div')]);
      smallCache.setSelectorResults('selector3', [doc.createElement('div')]);

      // Access selector1 (moves to end)
      smallCache.getSelectorResults('selector1');

      // Add 4th entry - should evict selector2 (oldest, not recently used)
      smallCache.setSelectorResults('selector4', [doc.createElement('div')]);

      expect(smallCache.getSelectorResults('selector1')).toBeDefined(); // Still there (was accessed)
      expect(smallCache.getSelectorResults('selector2')).toBeUndefined(); // Evicted
      expect(smallCache.getSelectorResults('selector3')).toBeDefined(); // Still there
      expect(smallCache.getSelectorResults('selector4')).toBeDefined(); // Still there
    });

    it('should track selector cache hits and misses', () => {
      const selector = 'button';
      const results = [doc.createElement('button')];

      // Miss
      cache.getSelectorResults(selector);
      const stats1 = cache.getStats();
      expect(stats1.selectorMisses).toBe(1);
      expect(stats1.selectorHits).toBe(0);

      // Set and hit
      cache.setSelectorResults(selector, results);
      cache.getSelectorResults(selector);
      const stats2 = cache.getStats();
      expect(stats2.selectorHits).toBe(1);
      expect(stats2.selectorMisses).toBe(1);
    });
  });

  describe('Anchor cache', () => {
    it('should cache anchor results', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      const anchorResult: AnchorResult = {
        element: doc.body,
        score: 0.5,
        tier: 'A',
        depth: 1,
      };

      // Cache miss
      expect(cache.getAnchor(button)).toBeUndefined();

      // Set and retrieve
      cache.setAnchor(button, anchorResult);
      const cached = cache.getAnchor(button);

      expect(cached).toBeDefined();
      expect(cached).toEqual(anchorResult);
    });

    it('should cache null anchor results', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      cache.setAnchor(button, null);
      const cached = cache.getAnchor(button);

      expect(cached).toBeNull();
    });

    it('should track anchor cache hits and misses', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      const anchorResult: AnchorResult = {
        element: doc.body,
        score: 0.5,
        tier: 'A',
        depth: 1,
      };

      // Miss
      cache.getAnchor(button);
      const stats1 = cache.getStats();
      expect(stats1.anchorMisses).toBe(1);
      expect(stats1.anchorHits).toBe(0);

      // Set and hit
      cache.setAnchor(button, anchorResult);
      cache.getAnchor(button);
      const stats2 = cache.getStats();
      expect(stats2.anchorHits).toBe(1);
      expect(stats2.anchorMisses).toBe(1);
    });
  });

  describe('Semantics cache', () => {
    it('should cache semantics', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const semantics: ElementSemantics = {
        id: 'test-button',
        classes: ['btn', 'primary'],
      };

      // Cache miss
      expect(cache.getSemantics(button)).toBeUndefined();

      // Set and retrieve
      cache.setSemantics(button, semantics);
      const cached = cache.getSemantics(button);

      expect(cached).toBeDefined();
      expect(cached).toEqual(semantics);
    });

    it('should track semantics cache hits and misses', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      const semantics: ElementSemantics = {
        id: 'test-button',
      };

      // Miss
      cache.getSemantics(button);
      const stats1 = cache.getStats();
      expect(stats1.semanticsMisses).toBe(1);
      expect(stats1.semanticsHits).toBe(0);

      // Set and hit
      cache.setSemantics(button, semantics);
      cache.getSemantics(button);
      const stats2 = cache.getStats();
      expect(stats2.semanticsHits).toBe(1);
      expect(stats2.semanticsMisses).toBe(1);
    });
  });

  describe('Cache clearing', () => {
    it('should clear selector cache', () => {
      cache.setSelectorResults('selector1', [doc.createElement('div')]);
      cache.setSelectorResults('selector2', [doc.createElement('div')]);

      expect(cache.getStats().selectorCacheSize).toBe(2);

      cache.clear();

      expect(cache.getStats().selectorCacheSize).toBe(0);
      expect(cache.getSelectorResults('selector1')).toBeUndefined();
      expect(cache.getSelectorResults('selector2')).toBeUndefined();
    });

    it('should reset statistics on clear', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      const dsl: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'body',
          semantics: {},
          score: 0.3,
          degraded: true,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.5,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 3,
        },
        meta: {
          confidence: 0.5,
          generatedAt: new Date().toISOString(),
          generator: 'dom-dsl@1.0',
          source: 'test',
          degraded: false,
        },
      };

      cache.setEID(button, dsl);
      cache.getEID(button);

      const statsBefore = cache.getStats();
      expect(statsBefore.eidHits).toBeGreaterThan(0);

      cache.clear();

      const statsAfter = cache.getStats();
      expect(statsAfter.eidHits).toBe(0);
      expect(statsAfter.eidMisses).toBe(0);
    });
  });

  describe('Cache hit rates', () => {
    it('should calculate DSL hit rate', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      const dsl: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'body',
          semantics: {},
          score: 0.3,
          degraded: true,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.5,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 3,
        },
        meta: {
          confidence: 0.5,
          generatedAt: new Date().toISOString(),
          generator: 'dom-dsl@1.0',
          source: 'test',
          degraded: false,
        },
      };

      // 1 miss, 0 hits = 0% hit rate
      cache.getEID(button);
      expect(cache.getEIDHitRate()).toBe(0);

      // 1 miss, 1 hit = 50% hit rate
      cache.setEID(button, dsl);
      cache.getEID(button);
      expect(cache.getEIDHitRate()).toBe(0.5);

      // 1 miss, 2 hits = 66.67% hit rate
      cache.getEID(button);
      expect(cache.getEIDHitRate()).toBeCloseTo(2 / 3, 2);
    });

    it('should calculate overall hit rate', () => {
      const button = doc.createElement('button');
      doc.body.appendChild(button);

      // Add some cache operations
      cache.setSelectorResults('button', [button]);
      cache.getSelectorResults('button'); // hit

      cache.getSelectorResults('div'); // miss

      const overallRate = cache.getOverallHitRate();
      expect(overallRate).toBeGreaterThan(0);
      expect(overallRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Global cache', () => {
    it('should return same global cache instance', () => {
      const cache1 = getGlobalCache();
      const cache2 = getGlobalCache();

      expect(cache1).toBe(cache2);
    });

    it('should reset global cache', () => {
      const cache1 = getGlobalCache();
      resetGlobalCache();
      const cache2 = getGlobalCache();

      expect(cache1).not.toBe(cache2);
    });
  });
});
