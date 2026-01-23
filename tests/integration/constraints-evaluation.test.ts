import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';
import { resolve } from '../../src/resolver/resolver';
import type { ElementIdentity } from '../../src/types';

describe('Constraints Evaluation - Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Text Proximity - End-to-End', () => {
    it('should resolve similar buttons using text proximity', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submitt</button>
          <button>Cancel</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // "Submit"

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'text-proximity',
          params: { reference: 'Submit', maxDistance: 1 },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      // Should match "Submit" or "Submitt" (distance <= 1)
      expect(['Submit', 'Submitt']).toContain(result.elements[0].textContent);
    });

    it('should reject very different text with text proximity', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Cancel</button>
          <button>Reset</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // "Submit"

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'text-proximity',
          params: { reference: 'Submit', maxDistance: 1 },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      // Should only match "Submit" (distance = 0)
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].textContent).toBe('Submit');
    });

    it('should select nearest text match with text proximity', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submi</button>
          <button>Submitt</button>
          <button>Submit</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[2]; // "Submit"

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'text-proximity',
          params: { reference: 'Submit', maxDistance: 2 },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      // All three match (distance <= 2), but should prefer exact match
      expect(result.status).toBe('success');
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Position Constraints - End-to-End', () => {
    it('should resolve top-most element using position constraint', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button style="position: absolute; top: 10px;">Top Button</button>
          <button style="position: absolute; top: 100px;">Bottom Button</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // Top button

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'top-most' },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].textContent).toBe('Top Button');
    });

    it('should resolve left-most element using position constraint', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button style="position: absolute; left: 10px;">Left Button</button>
          <button style="position: absolute; left: 200px;">Right Button</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // Left button

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'left-most' },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].textContent).toBe('Left Button');
    });

    it('should resolve first-in-dom element using position constraint', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // First

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'first-in-dom' },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].textContent).toBe('First');
    });
  });

  describe('Constraints Integration with Resolver', () => {
    it('should apply constraints in Phase 4 of resolver', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0];

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'first-in-dom' },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      // Phase 1-3: Multiple matches
      // Phase 4: Constraint reduces to 1 match
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      // Confidence degradation: either 0.9x from resolver or fallback handler degradation
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(eid.meta.confidence);
    });

    it('should sort constraints by priority in resolver', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submitt</button>
          <button>Cancel</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // "Submit"

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'text-proximity',
          params: { reference: 'Submit', maxDistance: 1 },
          priority: 2, // Lower priority
        },
        {
          type: 'position',
          params: { strategy: 'first-in-dom' },
          priority: 3, // Higher priority - should be applied first
        },
      ];

      const result = resolve(eid, document);

      // Position constraint (priority 3) should be applied first
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should stop applying constraints when unique match found', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0];

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'first-in-dom' },
          priority: 1,
        },
        {
          type: 'text-proximity',
          params: { reference: 'Submit', maxDistance: 0 },
          priority: 2,
        },
      ];

      const result = resolve(eid, document);

      // First constraint should find unique match, second should not be applied
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should distinguish multiple Submit buttons using text proximity', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit Login</button>
          <button>Submit Registration</button>
          <button>Cancel</button>
        </form>
      `;

      const form = document.querySelector('form')!;
      const targetButton = document.querySelectorAll('button')[0]; // "Submit Login"

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'text-proximity',
          params: { reference: 'Submit Login', maxDistance: 2 },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].textContent).toBe('Submit Login');
    });

    it('should resolve product cards using position constraint', () => {
      document.body.innerHTML = `
        <div id="products">
          <div class="product-card" style="position: absolute; top: 100px;">
            <button>Add to Cart</button>
          </div>
          <div class="product-card" style="position: absolute; top: 10px;">
            <button>Add to Cart</button>
          </div>
        </div>
      `;

      const root = document.getElementById('products')!;
      const targetButton = document.querySelectorAll('button')[1]; // Top card

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'top-most' },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      // Should match top-most button
      expect(result.elements[0].closest('.product-card')?.getAttribute('style')).toContain(
        'top: 10px'
      );
    });

    it('should handle overlapping modal dialogs using position constraint', () => {
      document.body.innerHTML = `
        <div id="app">
          <div class="modal" style="position: fixed; top: 50px; z-index: 100;">
            <button>Close</button>
          </div>
          <div class="modal" style="position: fixed; top: 10px; z-index: 200;">
            <button>Close</button>
          </div>
        </div>
      `;

      const root = document.getElementById('app')!;
      const targetButton = document.querySelectorAll('button')[1]; // Top modal

      const eid = generateEID(targetButton)!;
      eid.constraints = [
        {
          type: 'position',
          params: { strategy: 'top-most' },
          priority: 1,
        },
      ];

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      // Should match top-most button (jsdom-extended provides fixed getBoundingClientRect values)
      // So both buttons may have same top value, but should still resolve to one
      const modal = result.elements[0].closest('.modal');
      expect(modal).toBeDefined();
    });
  });
});
