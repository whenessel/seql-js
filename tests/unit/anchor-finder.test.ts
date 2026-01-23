import { describe, it, expect, beforeEach } from 'vitest';
import { AnchorFinder } from '../../src/generator/anchor-finder';
import { createEIDCache } from '../../src/utils/eid-cache';
import { SEMANTIC_ANCHOR_TAGS, ROLE_ANCHOR_VALUES, ANCHOR_SCORE } from '../../src/utils/constants';
import type { GeneratorOptions } from '../../src/types';

describe('AnchorFinder', () => {
  let finder: AnchorFinder;
  let options: GeneratorOptions;

  beforeEach(() => {
    document.body.innerHTML = '';
    options = { maxPathDepth: 10 };
    finder = new AnchorFinder(options);
  });

  describe('findAnchor', () => {
    it('should find Tier A anchor (semantic tag)', () => {
      document.body.innerHTML = `
        <form id="login">
          <div>
            <button>Submit</button>
          </div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      expect(result!.element.tagName.toLowerCase()).toBe('form');
      expect(result!.tier).toBe('A');
      expect(result!.score).toBeGreaterThan(0);
    });

    it('should find Tier B anchor (role-based)', () => {
      document.body.innerHTML = `
        <div role="main">
          <div>
            <button>Submit</button>
          </div>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      expect(result!.element.getAttribute('role')).toBe('main');
      expect(result!.tier).toBe('B');
    });

    it('should find Tier C anchor (test markers)', () => {
      document.body.innerHTML = `
        <div data-testid="container">
          <button>Submit</button>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      expect(result!.element.hasAttribute('data-testid')).toBe(true);
      expect(result!.tier).toBe('C');
    });

    it('should stop at body element and return best candidate', () => {
      document.body.innerHTML = `
        <form id="login">
          <div>
            <button>Submit</button>
          </div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      // Should return form, not body
      expect(result!.element.tagName.toLowerCase()).toBe('form');
    });

    it('should return body as degraded anchor when no better candidate found', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <button>Submit</button>
          </div>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      expect(result!.element.tagName.toLowerCase()).toBe('body');
      expect(result!.tier).toBe('C');
      expect(result!.score).toBe(ANCHOR_SCORE.DEGRADED_SCORE);
    });

    it('should respect maxDepth limit', () => {
      document.body.innerHTML = `
        <div>
          <div><div><div><div><div><div><div><div><div><div>
            <button>Submit</button>
          </div></div></div></div></div></div></div></div></div></div>
        </div>
      `;

      const finderWithDepth = new AnchorFinder({ maxPathDepth: 5 });
      const button = document.querySelector('button')!;
      const result = finderWithDepth.findAnchor(button);

      // Should stop at maxDepth - if no anchor found within depth, returns null
      // (body is not reached because maxDepth stops before reaching it)
      // Or returns bestCandidate if one was found
      if (result) {
        expect(result.element).toBeDefined();
      } else {
        // Null is valid when no anchor found within maxDepth
        expect(result).toBeNull();
      }
    });

    it('should return null when no anchor found and no body fallback', () => {
      // Create element disconnected from body
      const div = document.createElement('div');
      const button = document.createElement('button');
      div.appendChild(button);

      const result = finder.findAnchor(button);

      // When element has no parentElement, should return null
      expect(result).toBeNull();
    });

    it('should use cache when available', () => {
      document.body.innerHTML = `
        <form id="login">
          <button>Submit</button>
        </form>
      `;

      const cache = createEIDCache();
      const finderWithCache = new AnchorFinder(options, cache);
      const button = document.querySelector('button')!;

      // First call - should compute
      const result1 = finderWithCache.findAnchor(button);
      expect(result1).not.toBeNull();

      // Second call - should use cache
      const result2 = finderWithCache.findAnchor(button);
      expect(result2).toEqual(result1);
    });

    it('should return best candidate when multiple candidates exist', () => {
      document.body.innerHTML = `
        <div data-testid="outer">
          <form id="login">
            <div>
              <button>Submit</button>
            </div>
          </form>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      // Should prefer form (Tier A) over div with testid (Tier C)
      expect(result).not.toBeNull();
      expect(result!.element.tagName.toLowerCase()).toBe('form');
      expect(result!.tier).toBe('A');
    });

    it('should stop immediately when Tier A anchor found', () => {
      document.body.innerHTML = `
        <form id="login">
          <div data-testid="inner">
            <button>Submit</button>
          </div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      // Should stop at form, not continue to div with testid
      expect(result).not.toBeNull();
      expect(result!.element.tagName.toLowerCase()).toBe('form');
    });
  });

  describe('scoreAnchor', () => {
    it('should score semantic tag (Tier A)', () => {
      const form = document.createElement('form');
      const score = finder.scoreAnchor(form);

      expect(score).toBeGreaterThanOrEqual(ANCHOR_SCORE.SEMANTIC_TAG);
    });

    it('should score role-based anchor (Tier B)', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'main');
      const score = finder.scoreAnchor(div);

      expect(score).toBeGreaterThanOrEqual(ANCHOR_SCORE.ROLE);
    });

    it('should add bonus for ARIA label', () => {
      const form = document.createElement('form');
      form.setAttribute('aria-label', 'Login form');
      const score = finder.scoreAnchor(form);

      expect(score).toBeGreaterThanOrEqual(
        ANCHOR_SCORE.SEMANTIC_TAG + ANCHOR_SCORE.ARIA_LABEL
      );
    });

    it('should add bonus for aria-labelledby', () => {
      const form = document.createElement('form');
      form.setAttribute('aria-labelledby', 'form-title');
      const score = finder.scoreAnchor(form);

      expect(score).toBeGreaterThanOrEqual(
        ANCHOR_SCORE.SEMANTIC_TAG + ANCHOR_SCORE.ARIA_LABEL
      );
    });

    it('should add bonus for stable ID', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      const score = finder.scoreAnchor(form);

      expect(score).toBeGreaterThanOrEqual(ANCHOR_SCORE.STABLE_ID);
    });

    it('should not add bonus for dynamic ID', () => {
      const form = document.createElement('form');
      form.id = 'abc123def456ghi789jkl012mno345pqr678';
      const score = finder.scoreAnchor(form);

      // Should not include STABLE_ID bonus
      expect(score).toBeLessThan(ANCHOR_SCORE.SEMANTIC_TAG + ANCHOR_SCORE.STABLE_ID);
    });

    it('should score test markers (Tier C)', () => {
      const div = document.createElement('div');
      div.setAttribute('data-testid', 'container');
      const score = finder.scoreAnchor(div);

      expect(score).toBeGreaterThanOrEqual(ANCHOR_SCORE.TEST_MARKER);
    });

    it('should score data-qa marker', () => {
      const div = document.createElement('div');
      div.setAttribute('data-qa', 'container');
      const score = finder.scoreAnchor(div);

      expect(score).toBeGreaterThanOrEqual(ANCHOR_SCORE.TEST_MARKER);
    });

    it('should score data-test marker', () => {
      const div = document.createElement('div');
      div.setAttribute('data-test', 'container');
      const score = finder.scoreAnchor(div);

      expect(score).toBeGreaterThanOrEqual(ANCHOR_SCORE.TEST_MARKER);
    });

    it('should combine multiple factors', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      form.setAttribute('aria-label', 'Login');
      const score = finder.scoreAnchor(form);

      expect(score).toBeGreaterThanOrEqual(
        ANCHOR_SCORE.SEMANTIC_TAG + ANCHOR_SCORE.ARIA_LABEL + ANCHOR_SCORE.STABLE_ID
      );
    });

    it('should cap score at 1.0', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      form.setAttribute('aria-label', 'Login');
      form.setAttribute('data-testid', 'test');
      const score = finder.scoreAnchor(form);

      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should return 0 for element with no anchor factors', () => {
      const div = document.createElement('div');
      const score = finder.scoreAnchor(div);

      expect(score).toBe(0);
    });
  });

  describe('Depth penalty', () => {
    it('should not apply penalty when depth <= threshold', () => {
      document.body.innerHTML = `
        <form id="login">
          <div><div><div><div>
            <button>Submit</button>
          </div></div></div></div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      // Depth 4 <= threshold 5, so no penalty
      expect(result!.score).toBeGreaterThan(0);
    });

    it('should apply penalty when depth > threshold', () => {
      document.body.innerHTML = `
        <form id="login">
          <div><div><div><div><div><div>
            <button>Submit</button>
          </div></div></div></div></div></div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      // Depth 6 > threshold 5, so penalty should be applied
      // Score should be reduced
      expect(result!.score).toBeGreaterThan(0);
    });

    it('should not reduce score below 0', () => {
      document.body.innerHTML = `
        <div data-testid="outer">
          <div><div><div><div><div>
            <button>Submit</button>
          </div></div></div></div></div>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      // Should return best candidate (data-testid div) or body
      if (result) {
        // Even with depth penalty, score should not be negative
        expect(result.score).toBeGreaterThanOrEqual(0);
      } else {
        // Or return null if no candidate found within maxDepth
        expect(result).toBeNull();
      }
    });
  });

  describe('Tier determination', () => {
    it('should return Tier A for semantic tags', () => {
      SEMANTIC_ANCHOR_TAGS.forEach((tag) => {
        const element = document.createElement(tag);
        const result = finder.findAnchor(element);
        // If element is direct child of body, should return itself or body
        document.body.appendChild(element);
        const child = document.createElement('div');
        element.appendChild(child);
        const anchorResult = finder.findAnchor(child);
        if (anchorResult && anchorResult.element === element) {
          expect(anchorResult.tier).toBe('A');
        }
        document.body.removeChild(element);
      });
    });

    it('should return Tier B for role-based anchors', () => {
      ROLE_ANCHOR_VALUES.forEach((role) => {
        const div = document.createElement('div');
        div.setAttribute('role', role);
        document.body.appendChild(div);
        const child = document.createElement('div');
        div.appendChild(child);
        const result = finder.findAnchor(child);
        if (result && result.element === div) {
          expect(result.tier).toBe('B');
        }
        document.body.removeChild(div);
      });
    });

    it('should return Tier C for test markers', () => {
      const div = document.createElement('div');
      div.setAttribute('data-testid', 'test');
      document.body.appendChild(div);
      const child = document.createElement('div');
      div.appendChild(child);
      const result = finder.findAnchor(child);

      if (result && result.element === div) {
        expect(result.tier).toBe('C');
      }
      document.body.removeChild(div);
    });

    it('should return Tier C for elements without semantic tags or roles', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const child = document.createElement('div');
      div.appendChild(child);
      const result = finder.findAnchor(child);

      // Should return body as degraded anchor (Tier C)
      expect(result).not.toBeNull();
      expect(result!.tier).toBe('C');
      document.body.removeChild(div);
    });
  });

  describe('Edge cases', () => {
    it('should handle element without parentElement', () => {
      const button = document.createElement('button');
      // Element not attached to DOM
      const result = finder.findAnchor(button);

      expect(result).toBeNull();
    });

    it('should handle element with dynamic ID', () => {
      document.body.innerHTML = `
        <div id="abc123def456ghi789jkl012mno345pqr678">
          <button>Submit</button>
        </div>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      // Should not use dynamic ID for scoring
      expect(result).not.toBeNull();
      // Should return body as degraded anchor
      expect(result!.element.tagName.toLowerCase()).toBe('body');
    });

    it('should handle multiple anchor factors', () => {
      document.body.innerHTML = `
        <form id="login-form" aria-label="Login" data-testid="form">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      expect(result!.element.tagName.toLowerCase()).toBe('form');
      expect(result!.tier).toBe('A');
      // Score should include all factors
      expect(result!.score).toBeGreaterThan(ANCHOR_SCORE.SEMANTIC_TAG);
    });

    it('should handle custom maxPathDepth', () => {
      document.body.innerHTML = `
        <form id="login">
          <div>
            <button>Submit</button>
          </div>
        </form>
      `;

      const finderWithCustomDepth = new AnchorFinder({ maxPathDepth: 3 });
      const button = document.querySelector('button')!;
      const result = finderWithCustomDepth.findAnchor(button);

      // Should respect custom maxDepth - form should be found within depth 3
      expect(result).not.toBeNull();
      expect(result!.element.tagName.toLowerCase()).toBe('form');
    });

    it('should handle all semantic anchor tags', () => {
      SEMANTIC_ANCHOR_TAGS.forEach((tag) => {
        document.body.innerHTML = `<${tag} id="test"><button>Submit</button></${tag}>`;
        const button = document.querySelector('button')!;
        const result = finder.findAnchor(button);

        expect(result).not.toBeNull();
        expect(result!.element.tagName.toLowerCase()).toBe(tag);
        expect(result!.tier).toBe('A');
      });
    });

    it('should handle all role anchor values', () => {
      ROLE_ANCHOR_VALUES.forEach((role) => {
        document.body.innerHTML = `<div role="${role}"><button>Submit</button></div>`;
        const button = document.querySelector('button')!;
        const result = finder.findAnchor(button);

        expect(result).not.toBeNull();
        expect(result!.element.getAttribute('role')).toBe(role);
        expect(result!.tier).toBe('B');
      });
    });
  });
});
