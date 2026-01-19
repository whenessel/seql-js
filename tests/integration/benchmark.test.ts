import { describe, it, expect } from 'vitest';
import { generateEID, resolve } from '../../src';
import * as fs from 'fs';
import * as path from 'path';

describe('Benchmark: modern-seaside-stay.htm', () => {
  it('should benchmark generation and resolution for all DOM elements', () => {
    const htmlPath = path.resolve(__dirname, '../../fixtures/modern-seaside-stay.htm');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Используем JSDOM
    document.body.innerHTML = htmlContent;

    // Берем все элементы в body
    const allElements = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];

    // Фильтруем элементы, для которых генерация имеет смысл
    const elements = allElements.filter(el => {
      const tag = el.tagName.toLowerCase();
      return !['script', 'style', 'meta', 'link', 'noscript', 'br', 'head', 'html'].includes(tag);
    });

    console.log(`Found ${elements.length} elements for benchmarking`);

    const results: Array<{
      element: HTMLElement;
      eid: any;
    }> = [];

    // Benchmark Generation
    const genStart = performance.now();
    for (const el of elements) {
      const eid = generateEID(el);

      if (eid) {
        results.push({
          element: el,
          eid,
        });
      }
    }
    const genEnd = performance.now();
    const totalGenTime = genEnd - genStart;
    console.log(`Total generation time: ${totalGenTime.toFixed(2)}ms for ${elements.length} elements`);
    console.log(`Average generation time: ${(totalGenTime / elements.length).toFixed(4)}ms`);

    // Benchmark Resolution
    const resStart = performance.now();
    let successCount = 0;
    let degradedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      const resolveResult = resolve(result.eid, document);
      
      const isFound = resolveResult.elements.includes(result.element);

      if (isFound) {
        if (resolveResult.status === 'success') {
          successCount++;
        } else {
          degradedCount++;
        }
      } else {
        failedCount++;
        // console.error(`Failed to resolve ${result.element.tagName} ${result.element.className}`);
      }
    }
    const resEnd = performance.now();
    const totalResTime = resEnd - resStart;
    console.log(`Total resolution time: ${totalResTime.toFixed(2)}ms for ${results.length} elements`);
    console.log(`Average resolution time: ${(totalResTime / results.length).toFixed(4)}ms`);
    
    // Summary
    console.log('--- Benchmark Summary ---');
    console.log(`Total elements scanned: ${elements.length}`);
    console.log(`Successfully generated EIDs: ${results.length}`);
    console.log(`Resolution - Exact Success: ${successCount}`);
    console.log(`Resolution - Degraded Success: ${degradedCount}`);
    console.log(`Resolution - Failed: ${failedCount}`);
    console.log(`Total time: ${(totalGenTime + totalResTime).toFixed(2)}ms`);

    // Benchmark should pass if it finishes within a reasonable time
    expect(totalGenTime + totalResTime).toBeLessThan(10000);
  });
});
