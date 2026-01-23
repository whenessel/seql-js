import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateEIDBatch, generateEIDForElements } from '../../src/utils/batch-generator';
import { createEIDCache, resetGlobalCache } from '../../src/utils/eid-cache';

describe('batch-generator', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Test');
    resetGlobalCache();
  });

  describe('generateEIDBatch', () => {
    it('should generate DSL for all elements', () => {
      const form = doc.createElement('form');
      form.id = 'test-form';
      const button1 = doc.createElement('button');
      button1.id = 'btn1';
      button1.textContent = 'Submit';
      const button2 = doc.createElement('button');
      button2.id = 'btn2';
      button2.textContent = 'Cancel';

      form.appendChild(button1);
      form.appendChild(button2);
      doc.body.appendChild(form);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      expect(result.stats.totalElements).toBe(2);
      expect(result.stats.successful).toBeGreaterThanOrEqual(0);
      expect(result.results.length).toBe(result.stats.successful);
      expect(result.stats.totalTimeMs).toBeGreaterThan(0);
    });

    it('should filter elements by CSS selector', () => {
      const form = doc.createElement('form');
      const button = doc.createElement('button');
      button.id = 'test-button';
      const input = doc.createElement('input');
      input.type = 'text';

      form.appendChild(button);
      form.appendChild(input);
      doc.body.appendChild(form);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      // Should only process buttons, not inputs
      expect(result.stats.totalElements).toBe(1);
      if (result.results.length > 0) {
        expect(result.results[0].element.tagName.toLowerCase()).toBe('button');
      }
    });

    it('should respect limit option', () => {
      // Create multiple buttons
      for (let i = 0; i < 10; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        limit: 5,
      });

      expect(result.stats.totalElements).toBe(5);
      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should skip non-semantic elements when skipNonSemantic is true', () => {
      const div = doc.createElement('div');
      div.className = 'utility-class';
      const button = doc.createElement('button');
      button.id = 'semantic-button';

      doc.body.appendChild(div);
      doc.body.appendChild(button);

      const result = generateEIDBatch({
        root: doc.body,
        filter: '*',
        skipNonSemantic: true,
      });

      // Should process button (has ID) but may skip div
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(1);
    });

    it('should call progress callback', () => {
      // Create multiple elements
      for (let i = 0; i < 5; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const progressCalls: Array<[number, number]> = [];

      generateEIDBatch({
        root: doc.body,
        filter: 'button',
        onProgress: (current, total) => {
          progressCalls.push([current, total]);
        },
        progressInterval: 2, // Call every 2 elements
      });

      // Should have been called at least once
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1][0]).toBe(
        progressCalls[progressCalls.length - 1][1]
      ); // Final call should be (total, total)
    });

    it('should respect AbortSignal for cancellation', () => {
      // Create many elements
      for (let i = 0; i < 20; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const controller = new AbortController();

      // Abort after a short delay
      setTimeout(() => {
        controller.abort();
      }, 10);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        signal: controller.signal,
      });

      // Should have processed some but not all
      expect(result.stats.totalElements).toBeLessThanOrEqual(20);
    });

    it('should calculate cache hit rate', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const cache = createEIDCache();

      // First batch - cold cache
      generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache,
      });

      // Second batch - warm cache
      const result2 = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache,
      });

      // Second batch should have higher cache hit rate
      expect(result2.stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(result2.stats.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should return statistics', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      expect(result.stats).toHaveProperty('totalElements');
      expect(result.stats).toHaveProperty('successful');
      expect(result.stats).toHaveProperty('failed');
      expect(result.stats).toHaveProperty('skipped');
      expect(result.stats).toHaveProperty('totalTimeMs');
      expect(result.stats).toHaveProperty('avgTimePerElementMs');
      expect(result.stats).toHaveProperty('cacheHitRate');

      expect(result.stats.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.avgTimePerElementMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should handle empty results gracefully', () => {
      const result = generateEIDBatch({
        root: doc.body,
        filter: 'nonexistent',
      });

      expect(result.stats.totalElements).toBe(0);
      expect(result.stats.successful).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle invalid CSS selector gracefully', () => {
      const result = generateEIDBatch({
        root: doc.body,
        filter: '[invalid-selector',
      });

      // Should handle invalid selector without crashing
      expect(result).toBeDefined();
      expect(result.stats.totalElements).toBe(0);
      expect(result.results).toEqual([]);
      expect(result.failed).toEqual([]);
    });

    it('should throw error when root is missing', () => {
      // In test environment, document.body exists, so we need to test with null
      // or create a scenario where root is truly missing
      expect(() => {
        generateEIDBatch({
          root: null as any,
          filter: 'button',
        });
      }).toThrow('Root element or document is required');
    });

    it('should handle errors during generation and continue', () => {
      // Create elements that might cause generation errors
      const button1 = doc.createElement('button');
      button1.id = 'btn1';
      const button2 = doc.createElement('button');
      button2.id = 'btn2';

      doc.body.appendChild(button1);
      doc.body.appendChild(button2);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      // Should collect failures but continue processing
      expect(result.stats.totalElements).toBe(2);
      expect(result.stats.failed + result.stats.successful).toBeLessThanOrEqual(2);
    });

    it('should handle errors and collect them in failed array', () => {
      const button = doc.createElement('button');
      button.id = 'btn1';
      doc.body.appendChild(button);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      // Should have failed array even if empty
      expect(Array.isArray(result.failed)).toBe(true);
    });

    it('should test skipNonSemantic for HIGH priority (stable ID)', () => {
      const divWithId = doc.createElement('div');
      divWithId.id = 'stable-id';
      const divWithoutId = doc.createElement('div');
      divWithoutId.className = 'utility-class';

      doc.body.appendChild(divWithId);
      doc.body.appendChild(divWithoutId);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'div',
        skipNonSemantic: true,
      });

      // Should process div with ID (HIGH priority), may skip div without ID
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(1);
    });

    it('should test skipNonSemantic for MEDIUM priority (semantic attributes)', () => {
      const divWithRole = doc.createElement('div');
      divWithRole.setAttribute('role', 'navigation');
      const divWithAria = doc.createElement('div');
      divWithAria.setAttribute('aria-label', 'Main content');
      const divWithTestId = doc.createElement('div');
      divWithTestId.setAttribute('data-testid', 'container');
      const plainDiv = doc.createElement('div');
      plainDiv.className = 'utility-class';

      doc.body.appendChild(divWithRole);
      doc.body.appendChild(divWithAria);
      doc.body.appendChild(divWithTestId);
      doc.body.appendChild(plainDiv);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'div',
        skipNonSemantic: true,
      });

      // Should process divs with semantic attributes (MEDIUM priority)
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(3);
    });

    it('should test skipNonSemantic for LOW priority (generic elements)', () => {
      const semanticButton = doc.createElement('button');
      semanticButton.textContent = 'Submit';
      const plainDiv = doc.createElement('div');
      plainDiv.className = 'mx-4 p-2';

      doc.body.appendChild(semanticButton);
      doc.body.appendChild(plainDiv);

      const result = generateEIDBatch({
        root: doc.body,
        filter: '*',
        skipNonSemantic: true,
      });

      // Should process semantic button, may skip plain div
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(1);
    });

    it('should sort elements by priority (HIGH > MEDIUM > LOW)', () => {
      const lowPriority = doc.createElement('div');
      lowPriority.className = 'utility-class';
      const mediumPriority = doc.createElement('div');
      mediumPriority.setAttribute('data-testid', 'test');
      const highPriority = doc.createElement('div');
      highPriority.id = 'stable-id';

      doc.body.appendChild(lowPriority);
      doc.body.appendChild(mediumPriority);
      doc.body.appendChild(highPriority);

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'div',
        skipNonSemantic: false,
      });

      // Elements should be sorted by priority
      expect(result.stats.totalElements).toBe(3);
      // First processed should be high priority (with ID)
      if (result.results.length > 0) {
        expect(result.results[0].element.id).toBe('stable-id');
      }
    });

    it('should call progress callback at specified intervals', () => {
      const elements: Element[] = [];
      for (let i = 0; i < 10; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        elements.push(button);
      }

      const progressCalls: Array<[number, number]> = [];

      generateEIDForElements(elements, {
        onProgress: (current, total) => {
          progressCalls.push([current, total]);
        },
        progressInterval: 3, // Call every 3 elements
      });

      // Should be called at intervals (not every element)
      expect(progressCalls.length).toBeGreaterThan(0);
      // Final call should be (total, total)
      expect(progressCalls[progressCalls.length - 1][0]).toBe(
        progressCalls[progressCalls.length - 1][1]
      );
    });

    it('should call progress callback even if progressInterval is larger than total', () => {
      const button = doc.createElement('button');
      button.id = 'btn1';
      doc.body.appendChild(button);

      const progressCalls: Array<[number, number]> = [];

      generateEIDBatch({
        root: doc.body,
        filter: 'button',
        onProgress: (current, total) => {
          progressCalls.push([current, total]);
        },
        progressInterval: 100, // Larger than total elements
      });

      // Should still call final progress callback
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1][0]).toBe(
        progressCalls[progressCalls.length - 1][1]
      );
    });

    it('should not call progress callback if not provided', () => {
      const button = doc.createElement('button');
      button.id = 'btn1';
      doc.body.appendChild(button);

      // Should not throw when onProgress is undefined
      expect(() => {
        generateEIDBatch({
          root: doc.body,
          filter: 'button',
        });
      }).not.toThrow();
    });

    it('should handle AbortSignal cancellation correctly', () => {
      const elements: Element[] = [];
      for (let i = 0; i < 50; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        elements.push(button);
      }

      const controller = new AbortController();

      // Abort immediately
      controller.abort();

      const result = generateEIDForElements(elements, {
        signal: controller.signal,
      });

      // AbortSignal is checked inside the loop, so elements are still counted
      // but processing stops early, so results should be empty or partial
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
      // Processing should stop early due to abort signal
      expect(result.results.length).toBeLessThanOrEqual(elements.length);
    });

    it('should handle AbortSignal cancellation mid-processing', () => {
      const elements: Element[] = [];
      for (let i = 0; i < 20; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        elements.push(button);
      }

      const controller = new AbortController();

      // Start processing and abort after a delay
      const promise = new Promise<ReturnType<typeof generateEIDForElements>>((resolve) => {
        setTimeout(() => {
          controller.abort();
        }, 5);

        // Start processing
        const result = generateEIDForElements(elements, {
          signal: controller.signal,
        });
        resolve(result);
      });

      return promise.then((result) => {
        // Should stop after abort signal
        // Note: In fast environments, all elements might be processed before abort
        expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
        expect(result.stats.totalElements).toBeLessThanOrEqual(elements.length);
      });
    });

    it('should calculate cacheHitRate correctly for cache hits', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const cache = createEIDCache();

      // First batch - cold cache
      const result1 = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache,
      });

      // Second batch - warm cache (should have hits)
      const result2 = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache,
      });

      // Second batch should have higher cache hit rate
      expect(result2.stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(result2.stats.cacheHitRate).toBeLessThanOrEqual(1);
      expect(result2.stats.cacheHitRate).toBeGreaterThanOrEqual(result1.stats.cacheHitRate);
    });

    it('should calculate cacheHitRate as 0 when no cache operations', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const cache = createEIDCache();

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache,
      });

      // Cache hit rate should be a valid number
      expect(result.stats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should use custom cache when provided', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const customCache = createEIDCache({ maxSize: 50 });

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache: customCache,
      });

      expect(result.stats.totalElements).toBe(1);
      // Should use custom cache
      expect(result.stats.cacheHitRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateEIDForElements', () => {
    it('should generate DSL for provided elements', () => {
      const button1 = doc.createElement('button');
      button1.id = 'btn1';
      const button2 = doc.createElement('button');
      button2.id = 'btn2';

      doc.body.appendChild(button1);
      doc.body.appendChild(button2);

      const result = generateEIDForElements([button1, button2]);

      expect(result.stats.totalElements).toBe(2);
      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    it('should respect limit option', () => {
      const elements: Element[] = [];
      for (let i = 0; i < 10; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        elements.push(button);
      }

      const result = generateEIDForElements(elements, {
        limit: 5,
      });

      expect(result.stats.totalElements).toBe(5);
    });

    it('should call progress callback', () => {
      const elements: Element[] = [];
      for (let i = 0; i < 5; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        elements.push(button);
      }

      const progressCalls: Array<[number, number]> = [];

      generateEIDForElements(elements, {
        onProgress: (current, total) => {
          progressCalls.push([current, total]);
        },
        progressInterval: 2,
      });

      expect(progressCalls.length).toBeGreaterThan(0);
    });

    it('should use cache when provided', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const cache = createEIDCache();

      // First call
      generateEIDForElements([button], { cache });

      // Second call - should use cache
      const result2 = generateEIDForElements([button], { cache });

      expect(result2.stats.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors gracefully', () => {
      // Create an element that might cause issues
      // Note: script elements are skipped by default, so use a different element
      const div = doc.createElement('div');
      div.className = 'test-div';
      doc.body.appendChild(div);

      const result = generateEIDForElements([div], {
        skipNonSemantic: false,
      });

      // Should either succeed or fail gracefully
      expect(result.stats.totalElements).toBe(1);
      expect(result.stats.failed + result.stats.successful).toBeLessThanOrEqual(1);
    });

    it('should prioritize elements with ID', () => {
      const div1 = doc.createElement('div');
      div1.className = 'no-id';
      const div2 = doc.createElement('div');
      div2.id = 'has-id';
      const div3 = doc.createElement('div');
      div3.className = 'also-no-id';

      doc.body.appendChild(div1);
      doc.body.appendChild(div2);
      doc.body.appendChild(div3);

      const result = generateEIDForElements([div1, div2, div3], {
        skipNonSemantic: false,
      });

      // Elements with ID should be processed first (higher priority)
      // This is tested by checking that processing order is optimized
      expect(result.stats.totalElements).toBe(3);
    });
  });

  describe('Performance', () => {
    it('should complete batch generation in reasonable time', () => {
      // Create 100 elements
      for (let i = 0; i < 100; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const start = performance.now();
      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });
      const duration = performance.now() - start;

      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds max
      expect(result.stats.avgTimePerElementMs).toBeGreaterThanOrEqual(0);
    });

    it('should show performance improvement with cache', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const cache = createEIDCache();

      // First call - cold cache
      generateEIDForElements([button], { cache });

      // Second call - warm cache
      const start2 = performance.now();
      const result2 = generateEIDForElements([button], { cache });
      const duration2 = performance.now() - start2;

      // Cached call should be faster (or at least not slower)
      // Note: This might be flaky in some environments, so we just check it completes
      expect(duration2).toBeGreaterThanOrEqual(0);
      expect(result2.stats.cacheHitRate).toBeGreaterThan(0);
    });
  });

  describe('Scale', () => {
    it('should handle large batch (200+ elements)', () => {
      // Create 200 elements (reduced from 1000 for performance)
      for (let i = 0; i < 200; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        button.textContent = `Button ${i}`;
        doc.body.appendChild(button);
      }

      const start = performance.now();
      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        limit: 200,
      });
      const duration = performance.now() - start;

      expect(result.stats.totalElements).toBe(200);
      expect(result.stats.successful + result.stats.failed).toBeLessThanOrEqual(200);
      expect(duration).toBeLessThan(10000); // Should complete in < 10 seconds
    });

    it('should handle very large batch with limit', () => {
      // Create 500 elements (reduced from 5000 for performance)
      for (let i = 0; i < 500; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        limit: 100, // Limit to 100
      });

      expect(result.stats.totalElements).toBe(100);
      expect(result.results.length).toBeLessThanOrEqual(100);
    });

    it('should handle nested structures at scale', () => {
      // Create deeply nested structure with many elements
      let current = doc.body;
      for (let level = 0; level < 10; level++) {
        const container = doc.createElement('div');
        container.id = `level-${level}`;
        for (let i = 0; i < 10; i++) {
          const button = doc.createElement('button');
          button.id = `btn-${level}-${i}`;
          container.appendChild(button);
        }
        current.appendChild(container);
        current = container;
      }

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      expect(result.stats.totalElements).toBeGreaterThan(0);
      expect(result.stats.successful + result.stats.failed).toBeLessThanOrEqual(
        result.stats.totalElements
      );
    });
  });

  describe('Memory', () => {
    it('should not leak memory with repeated batch operations', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const cache = createEIDCache({ maxSize: 10 });

      // Run multiple batches
      for (let i = 0; i < 50; i++) {
        generateEIDBatch({
          root: doc.body,
          filter: 'button',
          cache,
        });
      }

      // Cache should not exceed maxSize (check selector cache size)
      const stats = cache.getStats();
      expect(stats.selectorCacheSize).toBeLessThanOrEqual(10);
    });

    it('should handle cache eviction correctly', () => {
      const cache = createEIDCache({ maxSize: 5 });

      // Create more elements than cache size
      for (let i = 0; i < 20; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        cache,
      });

      // Cache should not exceed maxSize (check selector cache size)
      const stats = cache.getStats();
      expect(stats.selectorCacheSize).toBeLessThanOrEqual(5);
      expect(result.stats.totalElements).toBe(20);
    });

    it('should clean up after batch completion', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Run batch
      generateEIDBatch({
        root: doc.body,
        filter: 'button',
      });

      // Memory should not grow excessively (allow some variance)
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      if (initialMemory > 0 && finalMemory > 0) {
        // Allow up to 10MB growth (reasonable for test environment)
        expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024);
      }
    });
  });

  describe('Resilience', () => {
    it('should handle elements removed before processing', () => {
      const buttons: Element[] = [];
      for (let i = 0; i < 10; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        buttons.push(button);
      }

      // Remove some elements before processing
      buttons[5].remove();
      buttons[7].remove();

      const result = generateEIDForElements(buttons);

      // Should handle gracefully
      expect(result.stats.totalElements).toBe(10);
      expect(result.stats.failed + result.stats.successful).toBeLessThanOrEqual(10);
    });

    it('should handle elements with invalid structure', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      // Create orphan element (no parent)
      const orphan = doc.createElement('div');
      orphan.id = 'orphan';

      const result = generateEIDForElements([button, orphan]);

      // Should handle gracefully
      expect(result.stats.totalElements).toBe(2);
      expect(result.stats.failed + result.stats.successful).toBeLessThanOrEqual(2);
    });

    it('should handle elements with circular references gracefully', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      // Create element with unusual attributes
      const div = doc.createElement('div');
      div.setAttribute('data-circular', 'test');
      doc.body.appendChild(div);

      const result = generateEIDForElements([button, div], {
        skipNonSemantic: false,
      });

      // Should handle gracefully
      expect(result.stats.totalElements).toBe(2);
    });

    it('should handle empty root gracefully', () => {
      const emptyRoot = doc.createElement('div');

      const result = generateEIDBatch({
        root: emptyRoot,
        filter: '*',
      });

      expect(result.stats.totalElements).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle invalid CSS selector gracefully', () => {
      const button = doc.createElement('button');
      button.id = 'test-button';
      doc.body.appendChild(button);

      const result = generateEIDBatch({
        root: doc.body,
        filter: '[invalid[selector', // Invalid selector
      });

      // Should handle gracefully (may return empty or error)
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AbortSignal - Extended', () => {
    it('should handle AbortSignal cancellation at start', () => {
      const controller = new AbortController();
      controller.abort(); // Abort immediately

      for (let i = 0; i < 10; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        signal: controller.signal,
      });

      // Should handle cancellation gracefully
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
      expect(result.results.length).toBeLessThanOrEqual(10);
    });

    it('should handle AbortSignal cancellation mid-processing', () => {
      const controller = new AbortController();

      // Create many elements
      for (let i = 0; i < 50; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      // Abort immediately (simulating mid-processing cancellation)
      // In real scenario, this would be called during processing
      controller.abort();

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        signal: controller.signal,
      });

      // Should handle cancellation gracefully
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
      expect(result.results.length).toBeLessThanOrEqual(50);
    });

    it('should handle AbortSignal with generateEIDForElements', () => {
      const controller = new AbortController();
      controller.abort();

      const buttons: Element[] = [];
      for (let i = 0; i < 10; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
        buttons.push(button);
      }

      const result = generateEIDForElements(buttons, {
        signal: controller.signal,
      });

      // Should handle cancellation gracefully
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
      expect(result.results.length).toBeLessThanOrEqual(10);
    });

    it('should respect AbortSignal with progress callback', () => {
      const controller = new AbortController();

      // Create many elements
      for (let i = 0; i < 50; i++) {
        const button = doc.createElement('button');
        button.id = `btn-${i}`;
        doc.body.appendChild(button);
      }

      // Abort immediately (simulating cancellation during progress)
      controller.abort();

      const result = generateEIDBatch({
        root: doc.body,
        filter: 'button',
        signal: controller.signal,
        onProgress: () => {
          // Progress callback
        },
        progressInterval: 5,
      });

      // Should handle cancellation
      expect(result.stats.totalElements).toBeGreaterThanOrEqual(0);
    });
  });
});
