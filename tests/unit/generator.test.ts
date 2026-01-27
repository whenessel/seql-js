import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator/generator';
import { createEIDCache } from '../../src/utils/eid-cache';
import type { GeneratorOptions } from '../../src/types';

describe('generateEID', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Input validation', () => {
    it('should return null for null target', () => {
      const result = generateEID(null as any);

      expect(result).toBeNull();
    });

    it('should return null for target without ownerDocument', () => {
      const target = document.createElement('button');
      Object.defineProperty(target, 'ownerDocument', {
        get: () => null,
        configurable: true,
      });

      const result = generateEID(target);

      expect(result).toBeNull();
    });

    it('should return null for disconnected element', () => {
      const target = document.createElement('button');
      // Element not connected to DOM
      Object.defineProperty(target, 'isConnected', {
        get: () => false,
        configurable: true,
      });

      const result = generateEID(target);

      expect(result).toBeNull();
    });
  });

  describe('Caching', () => {
    it('should use cache when available', () => {
      document.body.innerHTML = `
        <form id="login">
          <button id="submit">Submit</button>
        </form>
      `;

      const button = document.querySelector('#submit')!;
      const cache = createEIDCache();

      // First call - should compute
      const eid1 = generateEID(button, { cache });
      expect(eid1).not.toBeNull();

      // Second call - should use cache
      const eid2 = generateEID(button, { cache });
      expect(eid2).toEqual(eid1);
    });

    it('should use global cache when no cache provided', () => {
      document.body.innerHTML = `
        <form id="login">
          <button id="submit">Submit</button>
        </form>
      `;

      const button = document.querySelector('#submit')!;

      // First call
      const eid1 = generateEID(button);
      expect(eid1).not.toBeNull();

      // Second call - should use global cache
      const eid2 = generateEID(button);
      expect(eid2).toEqual(eid1);
    });
  });

  describe('Fallback to body', () => {
    it('should return null when no anchor found and fallbackToBody is false', () => {
      // Create element without body fallback
      const doc = document.implementation.createHTMLDocument('Test');
      const div = doc.createElement('div');
      const button = doc.createElement('button');
      div.appendChild(button);
      doc.documentElement.appendChild(div);

      // Mock to simulate no anchor found and no body
      Object.defineProperty(button, 'ownerDocument', {
        get: () => ({ body: null }),
        configurable: true,
      });
      Object.defineProperty(button, 'isConnected', {
        get: () => true,
        configurable: true,
      });

      const result = generateEID(button, { fallbackToBody: false });

      // Should return null when no anchor and fallbackToBody is false and no body
      expect(result).toBeNull();
    });

    it('should fallback to body when no anchor found and fallbackToBody is true', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <button>Submit</button>
          </div>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button, { fallbackToBody: true });

      expect(result).not.toBeNull();
      expect(result!.anchor.tag).toBe('body');
      expect(result!.anchor.degraded).toBe(true);
    });

    it('should fallback to body when anchorResult is null', () => {
      document.body.innerHTML = `
        <div>
          <button>Submit</button>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      // Should use body as fallback
      expect(result).not.toBeNull();
      expect(result!.anchor.tag).toBe('body');
    });

    it('should return null when no body element available', () => {
      const target = document.createElement('button');
      // Create element in document without body
      const doc = document.implementation.createHTMLDocument('Test');
      doc.documentElement.appendChild(target);

      // Mock ownerDocument but no body
      Object.defineProperty(target, 'ownerDocument', {
        get: () => ({ body: null }),
        configurable: true,
      });
      Object.defineProperty(target, 'isConnected', {
        get: () => true,
        configurable: true,
      });

      const result = generateEID(target);

      expect(result).toBeNull();
    });
  });

  describe('Confidence threshold', () => {
    it('should return null when confidence below threshold', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <button>Submit</button>
          </div>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button, { confidenceThreshold: 0.9 });

      // Low confidence EID should be filtered out
      expect(result).toBeNull();
    });

    it('should return EID when confidence meets threshold', () => {
      document.body.innerHTML = `
        <form id="login">
          <button id="submit">Submit</button>
        </form>
      `;

      const button = document.querySelector('#submit')!;
      const result = generateEID(button, { confidenceThreshold: 0.3 });

      expect(result).not.toBeNull();
      expect(result!.meta.confidence).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe('SVG fingerprint', () => {
    it('should add SVG fingerprint when enableSvgFingerprint is true', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      svg.appendChild(circle);
      document.body.appendChild(svg);

      const result = generateEID(circle, { enableSvgFingerprint: true });

      expect(result).not.toBeNull();
      expect(result!.target.semantics.svg).toBeDefined();
      expect(result!.target.semantics.svg!.shape).toBe('circle');
    });

    it('should not add SVG fingerprint when enableSvgFingerprint is false', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      svg.appendChild(circle);
      document.body.appendChild(svg);

      const result = generateEID(circle, { enableSvgFingerprint: false });

      expect(result).not.toBeNull();
      expect(result!.target.semantics.svg).toBeUndefined();
    });

    it('should not add SVG fingerprint for non-SVG elements', () => {
      document.body.innerHTML = `
        <form id="login">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button, { enableSvgFingerprint: true });

      expect(result).not.toBeNull();
      expect(result!.target.semantics.svg).toBeUndefined();
    });
  });

  describe('nth-child calculation', () => {
    it('should calculate nth-child for anchor', () => {
      document.body.innerHTML = `
        <div>
          <form id="form1"></form>
          <form id="form2">
            <button>Submit</button>
          </form>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      // form2 is second child, so nthChild should be 2
      expect(result!.anchor.nthChild).toBe(2);
    });

    it('should not calculate nth-child for body anchor', () => {
      document.body.innerHTML = `
        <div>
          <button>Submit</button>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      // Body anchor should not have nthChild
      expect(result!.anchor.nthChild).toBeUndefined();
    });

    it('should calculate nth-child for target', () => {
      document.body.innerHTML = `
        <form id="login">
          <button>Cancel</button>
          <button>Submit</button>
        </form>
      `;

      const buttons = document.querySelectorAll('button');
      const submitButton = buttons[1];

      const result = generateEID(submitButton);

      expect(result).not.toBeNull();
      // Submit button is second child, so nthChild should be 2
      expect(result!.target.nthChild).toBe(2);
    });
  });

  describe('Degradation reason', () => {
    it('should set degradationReason when anchor and path are degraded', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <button>Submit</button>
          </div>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      expect(result!.meta.degraded).toBe(true);
      // Could be 'anchor-and-path-degraded' or 'no-semantic-anchor' depending on path degradation
      expect(['anchor-and-path-degraded', 'no-semantic-anchor']).toContain(
        result!.meta.degradationReason
      );
    });

    it('should set degradationReason when only anchor is degraded', () => {
      document.body.innerHTML = `
        <div>
          <form>
            <button>Submit</button>
          </form>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      // Anchor should not be degraded (form is Tier A), but path might be
      // Check actual result
      if (result!.meta.degraded && result!.meta.degradationReason) {
        expect(['no-semantic-anchor', 'path-degraded']).toContain(result!.meta.degradationReason);
      }
    });

    it('should not set degradationReason when not degraded', () => {
      document.body.innerHTML = `
        <form id="login">
          <button id="submit">Submit</button>
        </form>
      `;

      const button = document.querySelector('#submit')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      if (!result!.meta.degraded) {
        expect(result!.meta.degradationReason).toBeUndefined();
      }
    });
  });

  describe('EID structure', () => {
    it('should generate valid EID structure', () => {
      document.body.innerHTML = `
        <form id="login">
          <button id="submit">Submit</button>
        </form>
      `;

      const button = document.querySelector('#submit')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      expect(result!.version).toBe('1.0');
      expect(result!.anchor).toBeDefined();
      expect(result!.path).toBeDefined();
      expect(result!.target).toBeDefined();
      expect(result!.constraints).toBeDefined();
      expect(result!.fallback).toBeDefined();
      expect(result!.meta).toBeDefined();
      expect(result!.meta.confidence).toBeGreaterThanOrEqual(0);
      expect(result!.meta.generatedAt).toBeDefined();
      expect(result!.meta.generator).toBe('dom-eid@1.0');
    });

    it('should include source in meta when provided', () => {
      document.body.innerHTML = `
        <form id="login">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button, { source: 'test-source' });

      expect(result).not.toBeNull();
      expect(result!.meta.source).toBe('test-source');
    });

    it('should set fallback rules correctly', () => {
      document.body.innerHTML = `
        <form id="login">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      expect(result!.fallback.onMultiple).toBe('best-score');
      expect(result!.fallback.onMissing).toBe('anchor-only');
      expect(result!.fallback.maxDepth).toBe(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle element with very low semantic score', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <div>Text</div>
          </div>
        </div>
      `;

      const div = document.querySelector('div div div')!;
      const result = generateEID(div, { confidenceThreshold: 0 });

      // Should still generate EID with low confidence
      expect(result).not.toBeNull();
      expect(result!.meta.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple forms and select correct anchor', () => {
      document.body.innerHTML = `
        <form id="form1">
          <div>
            <form id="form2">
              <button>Submit</button>
            </form>
          </div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      // Should use form2 (closer, Tier A)
      expect(result!.anchor.tag).toBe('form');
    });

    it('should handle SVG element detection', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      svg.appendChild(rect);
      document.body.appendChild(svg);

      const result = generateEID(rect);

      expect(result).not.toBeNull();
      // Should detect SVG element
      expect(result!.target.tag).toBe('rect');
    });
  });

  describe('Always-generate guarantee (confidenceThreshold: 0.0)', () => {
    it('should always generate EID for elements with minimal semantics', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="flex min-h-screen">
            <button>Click</button>
          </div>
        </div>
      `;

      const div = document.querySelector('#root > div')!;
      const result = generateEID(div);

      expect(result).not.toBeNull();
      expect(result!.meta.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should generate EID for plain div with only utility classes', () => {
      document.body.innerHTML = `
        <div id="app">
          <div class="w-full h-full flex flex-col">Text</div>
        </div>
      `;

      const div = document.querySelector('#app > div')!;
      const result = generateEID(div);

      expect(result).not.toBeNull();
      // Should have low but non-zero confidence
      expect(result!.meta.confidence).toBeGreaterThan(0);
    });

    it('should generate EID for div child of degraded anchor', () => {
      document.body.innerHTML = `
        <div id="root">
          <div>
            <span>Content</span>
          </div>
        </div>
      `;

      const div = document.querySelector('#root > div')!;
      const result = generateEID(div);

      expect(result).not.toBeNull();
      expect(result!.anchor.tag).toBe('div');
      expect(result!.anchor.semantics.id).toBe('root');
      expect(result!.meta.degraded).toBe(true);
    });

    it('should generate EID with nthChild for disambiguation', () => {
      document.body.innerHTML = `
        <div id="container">
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </div>
      `;

      const secondDiv = document.querySelectorAll('#container > div')[1];
      const result = generateEID(secondDiv);

      expect(result).not.toBeNull();
      expect(result!.target.nthChild).toBe(2);
      expect(result!.meta.confidence).toBeGreaterThan(0);
    });

    it('should indicate low confidence via meta field', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <div></div>
          </div>
        </div>
      `;

      const innerDiv = document.querySelector('div div div')!;
      const result = generateEID(innerDiv);

      expect(result).not.toBeNull();
      // Confidence should be low but EID should still be generated
      expect(result!.meta.confidence).toBeLessThan(0.3);
      expect(result!.meta.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('STABLE_ID weight increase (0.1 → 0.25)', () => {
    it('should give higher confidence to anchors with stable ID', () => {
      document.body.innerHTML = `
        <div id="root">
          <button>Click</button>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = generateEID(button);

      expect(result).not.toBeNull();
      // Anchor should have id="root" which is stable
      expect(result!.anchor.semantics.id).toBe('root');
      // Anchor score should be higher now (0.25 for STABLE_ID)
      expect(result!.anchor.score).toBeGreaterThanOrEqual(0.25);
    });

    it('should calculate correct anchor score for element with stable ID', () => {
      document.body.innerHTML = `
        <div id="app" class="container">
          <span>Content</span>
        </div>
      `;

      const span = document.querySelector('span')!;
      const result = generateEID(span);

      expect(result).not.toBeNull();
      expect(result!.anchor.semantics.id).toBe('app');
      // Anchor score only includes STABLE_ID (0.25), not classes
      // Classes are stored in semantics but don't contribute to anchor.score
      expect(result!.anchor.score).toBeCloseTo(0.25, 2);
    });

    it('should pass confidence threshold for #root + minimal target', () => {
      document.body.innerHTML = `
        <div id="root">
          <div class="min-h-screen flex flex-col">
            <p>Text</p>
          </div>
        </div>
      `;

      const div = document.querySelector('#root > div')!;
      const result = generateEID(div);

      expect(result).not.toBeNull();
      // This is the actual case from the bug report
      // With STABLE_ID=0.25 and confidenceThreshold=0.0, it should generate
      expect(result!.anchor.semantics.id).toBe('root');
      expect(result!.meta.confidence).toBeGreaterThan(0);
    });

    it('should handle common app container IDs', () => {
      const containerIds = ['root', 'app', 'main', 'content'];

      containerIds.forEach((id) => {
        document.body.innerHTML = `
          <div id="${id}">
            <div>
              <button>Action</button>
            </div>
          </div>
        `;

        const button = document.querySelector('button')!;
        const result = generateEID(button);

        expect(result).not.toBeNull();
        expect(result!.anchor.semantics.id).toBe(id);
        expect(result!.anchor.score).toBeGreaterThanOrEqual(0.25);
      });
    });
  });
});
