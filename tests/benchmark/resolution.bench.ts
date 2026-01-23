import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID, resolve } from '../../src';
import * as fs from 'fs';
import * as path from 'path';

describe('Benchmark: EID Resolution', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  it('should benchmark resolution for modern-seaside-stay.htm', () => {
    const htmlPath = path.resolve(__dirname, '../../fixtures/modern-seaside-stay.htm');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    document.body.innerHTML = htmlContent;

    const allElements = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];

    const elements = allElements.filter((el) => {
      const tag = el.tagName.toLowerCase();
      return !['script', 'style', 'meta', 'link', 'noscript', 'br', 'head', 'html'].includes(tag);
    });

    console.log(`\n📊 Benchmark: EID Resolution`);
    console.log(`Found ${elements.length} elements for benchmarking\n`);

    // Generate EIDs first
    const eids: Array<{ element: HTMLElement; eid: any }> = [];
    for (const el of elements) {
      const eid = generateEID(el);
      if (eid) {
        eids.push({ element: el, eid });
      }
    }

    // Warm-up run
    for (const { eid } of eids.slice(0, 10)) {
      resolve(eid, document);
    }

    // Benchmark Resolution
    const resStart = performance.now();
    let successCount = 0;
    let degradedCount = 0;
    let failedCount = 0;
    const resolutionTimes: number[] = [];

    for (const { element, eid } of eids) {
      const start = performance.now();
      const resolveResult = resolve(eid, document);
      const end = performance.now();

      resolutionTimes.push(end - start);

      const isFound = resolveResult.elements.includes(element);

      if (isFound) {
        if (resolveResult.status === 'success') {
          successCount++;
        } else {
          degradedCount++;
        }
      } else {
        failedCount++;
      }
    }
    const resEnd = performance.now();
    const totalResTime = resEnd - resStart;

    // Statistics
    const avgTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    const minTime = Math.min(...resolutionTimes);
    const maxTime = Math.max(...resolutionTimes);
    const medianTime = resolutionTimes.sort((a, b) => a - b)[
      Math.floor(resolutionTimes.length / 2)
    ];

    console.log('--- Resolution Results ---');
    console.log(`Total EIDs resolved: ${eids.length}`);
    console.log(`Total resolution time: ${totalResTime.toFixed(2)}ms`);
    console.log(`Average time per resolution: ${avgTime.toFixed(4)}ms`);
    console.log(`Min time: ${minTime.toFixed(4)}ms`);
    console.log(`Max time: ${maxTime.toFixed(4)}ms`);
    console.log(`Median time: ${medianTime.toFixed(4)}ms`);
    console.log(`Throughput: ${((eids.length / totalResTime) * 1000).toFixed(2)} resolutions/sec`);
    console.log(`\n--- Resolution Quality ---`);
    console.log(
      `Exact Success: ${successCount} (${((successCount / eids.length) * 100).toFixed(2)}%)`
    );
    console.log(
      `Degraded Success: ${degradedCount} (${((degradedCount / eids.length) * 100).toFixed(2)}%)`
    );
    console.log(`Failed: ${failedCount} (${((failedCount / eids.length) * 100).toFixed(2)}%)\n`);

    // Benchmark should pass if it finishes within a reasonable time
    expect(totalResTime).toBeLessThan(5000); // 5 seconds max
    expect(successCount + degradedCount).toBeGreaterThan(0);
  });

  it('should benchmark resolution for simple DOM structures', () => {
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
    const eids = elements
      .map((el) => ({ element: el, eid: generateEID(el)! }))
      .filter((e) => e.eid);

    console.log(`\n📊 Benchmark: Simple DOM Resolution`);
    console.log(`Found ${eids.length} EIDs\n`);

    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      for (const { eid } of eids) {
        resolve(eid, document);
      }
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / (iterations * eids.length);

    console.log('--- Simple DOM Resolution Results ---');
    console.log(`Iterations: ${iterations}`);
    console.log(`EIDs per iteration: ${eids.length}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per resolution: ${avgTime.toFixed(4)}ms`);
    console.log(
      `Throughput: ${(((iterations * eids.length) / totalTime) * 1000).toFixed(2)} resolutions/sec\n`
    );

    expect(totalTime).toBeLessThan(2000); // 2 seconds max
  });

  it('should benchmark resolution with constraints', () => {
    document.body.innerHTML = `
      <form id="login-form">
        <button>Submit</button>
        <button>Submit</button>
        <button>Submit</button>
      </form>
    `;

    const button = document.querySelector('button')!;
    const eid = generateEID(button)!;
    eid.constraints = [
      {
        type: 'position',
        params: { strategy: 'first-in-dom' },
        priority: 1,
      },
    ];

    console.log(`\n📊 Benchmark: Resolution with Constraints\n`);

    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      resolve(eid, document);
    }

    const end = performance.now();
    const totalTime = end - start;
    const avgTime = totalTime / iterations;

    console.log('--- Constrained Resolution Results ---');
    console.log(`Iterations: ${iterations}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per resolution: ${avgTime.toFixed(4)}ms`);
    console.log(`Throughput: ${((iterations / totalTime) * 1000).toFixed(2)} resolutions/sec\n`);

    expect(totalTime).toBeLessThan(1000); // 1 second max
  });
});
