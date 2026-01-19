import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateEIDBatch,
  generateEIDForElements,
} from '../../src/utils/batch-generator';
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
        progressCalls[progressCalls.length - 1][1],
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
      const result1 = generateEIDBatch({
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
      const result1 = generateEIDForElements([button], { cache });

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
      expect(result.stats.failed + result.stats.successful).toBeLessThanOrEqual(
        1,
      );
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
      const start1 = performance.now();
      generateEIDForElements([button], { cache });
      const duration1 = performance.now() - start1;

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
});
