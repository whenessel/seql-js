import { describe, it, expect, beforeEach } from 'vitest';
import { generateEIDBatch, generateEIDForElements } from '../../src/utils/batch-generator';
import { createEIDCache } from '../../src/utils/eid-cache';

describe('Benchmark: Batch Operations', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('should benchmark batch generation for large DOM', () => {
    // Create large DOM structure
    for (let i = 0; i < 500; i++) {
      const button = document.createElement('button');
      button.id = `btn-${i}`;
      button.textContent = `Button ${i}`;
      document.body.appendChild(button);
    }

    console.log(`\n📊 Benchmark: Batch Generation`);
    console.log(`Created 500 elements\n`);

    const start = performance.now();
    const result = generateEIDBatch({
      root: document.body,
      filter: 'button',
    });
    const end = performance.now();

    const totalTime = end - start;

    console.log('--- Batch Generation Results ---');
    console.log(`Total elements: ${result.stats.totalElements}`);
    console.log(`Successful: ${result.stats.successful}`);
    console.log(`Failed: ${result.stats.failed}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per element: ${result.stats.avgTimePerElementMs.toFixed(4)}ms`);
    console.log(`Cache hit rate: ${(result.stats.cacheHitRate * 100).toFixed(2)}%`);
    console.log(
      `Throughput: ${((result.stats.totalElements / totalTime) * 1000).toFixed(2)} elements/sec\n`
    );

    expect(totalTime).toBeLessThan(3000); // 3 seconds max
  });

  it('should benchmark batch generation with cache', () => {
    const cache = createEIDCache({ maxSize: 100 });

    // Create elements
    for (let i = 0; i < 200; i++) {
      const button = document.createElement('button');
      button.id = `btn-${i}`;
      document.body.appendChild(button);
    }

    console.log(`\n📊 Benchmark: Batch Generation with Cache`);
    console.log(`Created 200 elements\n`);

    // First run - cold cache
    const start1 = performance.now();
    const result1 = generateEIDBatch({
      root: document.body,
      filter: 'button',
      cache,
    });
    const end1 = performance.now();
    const coldTime = end1 - start1;

    // Second run - warm cache
    const start2 = performance.now();
    const result2 = generateEIDBatch({
      root: document.body,
      filter: 'button',
      cache,
    });
    const end2 = performance.now();
    const warmTime = end2 - start2;

    const speedup = ((coldTime - warmTime) / coldTime) * 100;

    console.log('--- Cache Performance Results ---');
    console.log(`Cold cache time: ${coldTime.toFixed(2)}ms`);
    console.log(`Warm cache time: ${warmTime.toFixed(2)}ms`);
    console.log(`Speedup: ${speedup.toFixed(2)}%`);
    console.log(`Cache hit rate (warm): ${(result2.stats.cacheHitRate * 100).toFixed(2)}%\n`);

    expect(warmTime).toBeLessThanOrEqual(coldTime);
  });

  it('should benchmark generateEIDForElements for large arrays', () => {
    const elements: Element[] = [];
    for (let i = 0; i < 500; i++) {
      const button = document.createElement('button');
      button.id = `btn-${i}`;
      document.body.appendChild(button);
      elements.push(button);
    }

    console.log(`\n📊 Benchmark: generateEIDForElements`);
    console.log(`Created 500 elements\n`);

    const start = performance.now();
    const result = generateEIDForElements(elements);
    const end = performance.now();

    const totalTime = end - start;

    console.log('--- generateEIDForElements Results ---');
    console.log(`Total elements: ${result.stats.totalElements}`);
    console.log(`Successful: ${result.stats.successful}`);
    console.log(`Failed: ${result.stats.failed}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per element: ${result.stats.avgTimePerElementMs.toFixed(4)}ms`);
    console.log(
      `Throughput: ${((result.stats.totalElements / totalTime) * 1000).toFixed(2)} elements/sec\n`
    );

    expect(totalTime).toBeLessThan(5000); // 5 seconds max
  });

  it('should benchmark batch generation with progress callback', () => {
    for (let i = 0; i < 300; i++) {
      const button = document.createElement('button');
      button.id = `btn-${i}`;
      document.body.appendChild(button);
    }

    console.log(`\n📊 Benchmark: Batch with Progress Callback`);
    console.log(`Created 300 elements\n`);

    const progressCalls: Array<[number, number]> = [];
    const start = performance.now();

    const result = generateEIDBatch({
      root: document.body,
      filter: 'button',
      onProgress: (current, total) => {
        progressCalls.push([current, total]);
      },
      progressInterval: 10,
    });

    const end = performance.now();
    const totalTime = end - start;

    console.log('--- Progress Callback Results ---');
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Progress callbacks: ${progressCalls.length}`);
    console.log(`Average callback interval: ${(totalTime / progressCalls.length).toFixed(2)}ms\n`);

    expect(totalTime).toBeLessThan(2000); // 2 seconds max
    expect(progressCalls.length).toBeGreaterThan(0);
  });
});
