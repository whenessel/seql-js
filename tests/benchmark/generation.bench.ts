import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';
import * as fs from 'fs';
import * as path from 'path';

describe('Benchmark: EID Generation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('should benchmark generation for modern-seaside-stay.htm', () => {
    const htmlPath = path.resolve(__dirname, '../../fixtures/modern-seaside-stay.htm');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    document.body.innerHTML = htmlContent;

    const allElements = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];

    const elements = allElements.filter((el) => {
      const tag = el.tagName.toLowerCase();
      return !['script', 'style', 'meta', 'link', 'noscript', 'br', 'head', 'html'].includes(tag);
    });

    console.log(`\n📊 Benchmark: EID Generation`);
    console.log(`Found ${elements.length} elements for benchmarking\n`);

    const results: Array<{
      element: HTMLElement;
      eid: any;
      time: number;
    }> = [];

    // Warm-up run
    for (const el of elements.slice(0, 10)) {
      generateEID(el);
    }

    // Benchmark Generation
    const genStart = performance.now();
    for (const el of elements) {
      const start = performance.now();
      const eid = generateEID(el);
      const end = performance.now();

      if (eid) {
        results.push({
          element: el,
          eid,
          time: end - start,
        });
      }
    }
    const genEnd = performance.now();
    const totalGenTime = genEnd - genStart;

    // Statistics
    const times = results.map((r) => r.time);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

    console.log('--- Generation Results ---');
    console.log(`Total elements scanned: ${elements.length}`);
    console.log(`Successfully generated EIDs: ${results.length}`);
    console.log(`Total generation time: ${totalGenTime.toFixed(2)}ms`);
    console.log(`Average time per element: ${avgTime.toFixed(4)}ms`);
    console.log(`Min time: ${minTime.toFixed(4)}ms`);
    console.log(`Max time: ${maxTime.toFixed(4)}ms`);
    console.log(`Median time: ${medianTime.toFixed(4)}ms`);
    console.log(
      `Throughput: ${((elements.length / totalGenTime) * 1000).toFixed(2)} elements/sec\n`
    );

    // Benchmark should pass if it finishes within a reasonable time
    expect(totalGenTime).toBeLessThan(5000); // 5 seconds max
    expect(results.length).toBeGreaterThan(0);
  });

  it('should benchmark generation for simple DOM structures', () => {
    document.body.innerHTML = `
      <form id="login-form">
        <div class="container">
          <input type="email" id="email" />
          <input type="password" id="password" />
          <button type="submit">Submit</button>
        </div>
      </form>
    `;

    const elements = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];

    console.log(`\n📊 Benchmark: Simple DOM Generation`);
    console.log(`Found ${elements.length} elements\n`);

    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      for (const el of elements) {
        generateEID(el);
      }
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / (iterations * elements.length);

    console.log('--- Simple DOM Results ---');
    console.log(`Iterations: ${iterations}`);
    console.log(`Elements per iteration: ${elements.length}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per element: ${avgTime.toFixed(4)}ms`);
    console.log(
      `Throughput: ${(((iterations * elements.length) / totalTime) * 1000).toFixed(2)} elements/sec\n`
    );

    expect(totalTime).toBeLessThan(2000); // 2 seconds max
  });

  it('should benchmark generation for deeply nested structures', () => {
    let current = document.body;
    for (let i = 0; i < 20; i++) {
      const div = document.createElement('div');
      div.id = `level-${i}`;
      current.appendChild(div);
      current = div;
    }
    const button = document.createElement('button');
    button.textContent = 'Deep Button';
    current.appendChild(button);

    const elements = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];

    console.log(`\n📊 Benchmark: Deeply Nested Structure`);
    console.log(`Found ${elements.length} elements (depth: 20)\n`);

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      for (const el of elements) {
        generateEID(el);
      }
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / (iterations * elements.length);

    console.log('--- Deeply Nested Results ---');
    console.log(`Iterations: ${iterations}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per element: ${avgTime.toFixed(4)}ms\n`);

    expect(totalTime).toBeLessThan(3000); // 3 seconds max
  });
});
