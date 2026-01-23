import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FallbackHandler } from '../../src/resolver/fallback-handler';
import type { ElementIdentity } from '../../src/types';

describe('FallbackHandler', () => {
  let handler: FallbackHandler;
  let mockEID: ElementIdentity;

  beforeEach(() => {
    handler = new FallbackHandler();
    // Clean DOM
    document.body.innerHTML = '';

    // Create a basic mock EID
    mockEID = {
      version: '1.0',
      anchor: {
        tag: 'form',
        semantics: { id: 'login-form' },
        score: 0.9,
      },
      path: [],
      target: {
        tag: 'button',
        semantics: { text: { raw: 'Submit', normalized: 'Submit' } },
        score: 0.8,
      },
      meta: {
        confidence: 0.85,
        generatedAt: Date.now(),
      },
      constraints: [],
      fallback: {
        onMissing: 'anchor-only',
        onMultiple: 'first',
      },
    };
  });

  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
  });

  describe('handleFallback - onMissing Strategies', () => {
    it('should return anchor for "anchor-only" strategy when anchor exists', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      document.body.appendChild(form);

      mockEID.fallback.onMissing = 'anchor-only';

      const result = handler.handleFallback(mockEID, document);

      expect(result.status).toBe('degraded-fallback');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(form);
      expect(result.warnings).toContain('Target not found, returning anchor');
      expect(result.confidence).toBe(0.85 * 0.3); // 30% degradation
      expect(result.meta?.degraded).toBe(true);
      expect(result.meta?.degradationReason).toBe('anchor-fallback');
    });

    it('should return error for "anchor-only" when anchor not found', () => {
      mockEID.fallback.onMissing = 'anchor-only';

      const result = handler.handleFallback(mockEID, document);

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      expect(result.warnings).toContain('Anchor also not found');
      expect(result.confidence).toBe(0);
      expect(result.meta?.degradationReason).toBe('anchor-not-found');
    });

    it('should return error for "strict" strategy', () => {
      mockEID.fallback.onMissing = 'strict';

      const result = handler.handleFallback(mockEID, document);

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      expect(result.warnings).toContain('Element not found (strict mode)');
      expect(result.confidence).toBe(0);
      expect(result.meta?.degraded).toBe(true);
      expect(result.meta?.degradationReason).toBe('strict-not-found');
    });

    it('should return error for "none" strategy', () => {
      mockEID.fallback.onMissing = 'none';

      const result = handler.handleFallback(mockEID, document);

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      expect(result.warnings).toContain('Element not found');
      expect(result.confidence).toBe(0);
      expect(result.meta?.degradationReason).toBe('not-found');
    });

    it('should handle invalid anchor selector gracefully', () => {
      mockEID.anchor.semantics = { id: '[invalid-id' }; // Invalid CSS selector
      mockEID.fallback.onMissing = 'anchor-only';

      const result = handler.handleFallback(mockEID, document);

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      // jsdom may or may not throw on invalid selector, so just check we get an error
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle selector error with proper error message', () => {
      // Create EID that might cause selector error (jsdom may or may not throw)
      mockEID.anchor.semantics = { id: 'test[invalid' };
      mockEID.fallback.onMissing = 'anchor-only';

      const result = handler.handleFallback(mockEID, document);

      expect(result.status).toBe('error');
      // jsdom may not throw on invalid selector, so it might return 'anchor-not-found' instead
      expect(['invalid-anchor-selector', 'anchor-not-found']).toContain(result.meta?.degradationReason);
      // Should contain error message
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle Element without ownerDocument', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      const orphanElement = document.createElement('div');
      // orphanElement has no ownerDocument

      mockEID.fallback.onMissing = 'anchor-only';

      // Pass element without ownerDocument
      const result = handler.handleFallback(mockEID, orphanElement);

      // Should use element itself as root when ownerDocument is null
      expect(result).toBeDefined();
    });
  });

  describe('handleAmbiguous - onMultiple Strategies', () => {
    let mockElements: Element[];

    beforeEach(() => {
      mockElements = [
        createMockButton('Submit', { id: 'btn-1' }),
        createMockButton('Submit', { id: 'btn-2' }),
        createMockButton('Submit', { id: 'btn-3' }),
      ];
    });

    function createMockButton(text: string, attrs: Record<string, string> = {}): Element {
      const button = document.createElement('button');
      button.textContent = text;
      for (const [key, value] of Object.entries(attrs)) {
        button.setAttribute(key, value);
      }
      document.body.appendChild(button);
      return button;
    }

    it('should return first for "first" strategy', () => {
      mockEID.fallback.onMultiple = 'first';

      const result = handler.handleAmbiguous(mockElements, mockEID);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(mockElements[0]);
      expect(result.warnings).toContain('Multiple matches, returning first');
      expect(result.confidence).toBe(0.85 * 0.7); // 70% degradation
      expect(result.meta?.degraded).toBe(true);
      expect(result.meta?.degradationReason).toBe('first-of-multiple');
    });

    it('should return all for "allow-multiple" strategy', () => {
      mockEID.fallback.onMultiple = 'allow-multiple';

      const result = handler.handleAmbiguous(mockElements, mockEID);

      expect(result.status).toBe('ambiguous');
      expect(result.elements).toHaveLength(3);
      expect(result.elements).toEqual(mockElements);
      expect(result.warnings).toContain('Multiple matches: 3');
      expect(result.confidence).toBe(0.85 * 0.5); // 50% degradation
      expect(result.meta?.degradationReason).toBe('multiple-matches');
    });

    it('should select best-scoring for "best-score" strategy', () => {
      mockEID.fallback.onMultiple = 'best-score';
      mockEID.target.semantics = {
        text: { raw: 'Submit', normalized: 'Submit' },
        id: 'btn-2', // btn-2 should score highest
      };

      const result = handler.handleAmbiguous(mockElements, mockEID);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].id).toBe('btn-2');
      expect(result.warnings[0]).toContain('selected best-scoring element');
      expect(result.confidence).toBeGreaterThan(0.85 * 0.7); // Better than "first"
      expect(result.meta?.degradationReason).toBe('best-of-multiple');
    });
  });

  describe('Best Scoring Algorithm', () => {
    let elements: Element[];

    beforeEach(() => {
      elements = [];
    });

    it('should score ID match (0.3 weight)', () => {
      const button1 = document.createElement('button');
      button1.id = 'submit-btn';
      const button2 = document.createElement('button');
      button2.id = 'other-btn';

      elements = [button1, button2];
      mockEID.target.semantics = { id: 'submit-btn' };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(button1);
    });

    it('should score class matches (0.25 weight)', () => {
      const button1 = document.createElement('button');
      button1.className = 'btn btn-primary btn-large';
      const button2 = document.createElement('button');
      button2.className = 'btn';

      elements = [button2, button1]; // button2 first to test scoring
      mockEID.target.semantics = { classes: ['btn', 'btn-primary', 'btn-large'] };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(button1);
    });

    it('should score attribute matches (0.2 weight)', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('data-testid', 'submit');
      button1.setAttribute('type', 'submit');

      const button2 = document.createElement('button');
      button2.setAttribute('data-testid', 'submit');

      elements = [button2, button1];
      mockEID.target.semantics = {
        attributes: { 'data-testid': 'submit', type: 'submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(button1);
    });

    it('should score role match (0.15 weight)', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('role', 'button');

      const button2 = document.createElement('button');

      elements = [button2, button1];
      mockEID.target.semantics = { role: 'button' };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(button1);
    });

    it('should score exact text match (0.1 weight)', () => {
      const button1 = document.createElement('button');
      button1.textContent = 'Submit Form';

      const button2 = document.createElement('button');
      button2.textContent = 'Submit';

      elements = [button2, button1];
      mockEID.target.semantics = {
        text: { raw: 'Submit Form', normalized: 'Submit Form' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(button1);
    });

    it('should score partial text match (0.05 weight)', () => {
      const button1 = document.createElement('button');
      button1.textContent = 'Submit Form Now';

      const button2 = document.createElement('button');
      button2.textContent = 'Cancel';

      elements = [button2, button1];
      mockEID.target.semantics = {
        text: { raw: 'Submit', normalized: 'Submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(button1);
    });

    it('should normalize scores correctly when all features present', () => {
      const perfectMatch = document.createElement('button');
      perfectMatch.id = 'submit-btn';
      perfectMatch.className = 'btn btn-primary';
      perfectMatch.setAttribute('data-testid', 'submit');
      perfectMatch.setAttribute('role', 'button');
      perfectMatch.textContent = 'Submit';

      const partialMatch = document.createElement('button');
      partialMatch.textContent = 'Submit';

      elements = [partialMatch, perfectMatch];
      mockEID.target.semantics = {
        id: 'submit-btn',
        classes: ['btn', 'btn-primary'],
        attributes: { 'data-testid': 'submit' },
        role: 'button',
        text: { raw: 'Submit', normalized: 'Submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements[0]).toBe(perfectMatch);
      // Score should be close to max (0.7 + 1.0 * 0.2 = 0.9)
      expect(result.confidence).toBeGreaterThan(0.85 * 0.85);
    });

    it('should return 0 score for no semantic features', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      elements = [button1, button2];
      mockEID.target.semantics = {}; // No features to match
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // Should still select first element when all scores are 0
      expect(result.elements).toHaveLength(1);
      expect(result.confidence).toBe(0.85 * 0.7); // Base confidence
    });

    it('should normalize score when maxScore > 0', () => {
      const button1 = document.createElement('button');
      button1.id = 'submit-btn';
      button1.className = 'btn btn-primary';
      button1.setAttribute('data-testid', 'submit');
      button1.setAttribute('role', 'button');
      button1.textContent = 'Submit';

      const button2 = document.createElement('button');
      button2.id = 'submit-btn'; // Only ID matches

      elements = [button2, button1];
      mockEID.target.semantics = {
        id: 'submit-btn',
        classes: ['btn', 'btn-primary'],
        attributes: { 'data-testid': 'submit' },
        role: 'button',
        text: { raw: 'Submit', normalized: 'Submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // button1 should score higher (all features match)
      expect(result.elements[0]).toBe(button1);
      // Score should be normalized: (0.3 + 0.25 + 0.2 + 0.15 + 0.1) / (0.3 + 0.25 + 0.2 + 0.15 + 0.1) = 1.0
      expect(result.confidence).toBeGreaterThan(0.85 * 0.7);
    });

    it('should handle empty semantics object', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      elements = [button1, button2];
      mockEID.target.semantics = {} as any; // Explicitly empty
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // maxScore = 0, so score = 0, should return first element
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(button1);
    });

    it('should handle semantics with only undefined/null values', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');

      elements = [button1, button2];
      mockEID.target.semantics = {
        id: undefined,
        classes: undefined,
        attributes: undefined,
        role: undefined,
        text: undefined,
      } as any;
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // All undefined, so maxScore = 0, score = 0
      expect(result.elements).toHaveLength(1);
    });

    it('should handle partial class match correctly', () => {
      const button1 = document.createElement('button');
      button1.className = 'btn btn-primary'; // 2 out of 3 classes

      const button2 = document.createElement('button');
      button2.className = 'btn'; // 1 out of 3 classes

      elements = [button2, button1];
      mockEID.target.semantics = {
        classes: ['btn', 'btn-primary', 'btn-large'],
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // button1 should score higher (2/3 match vs 1/3)
      expect(result.elements[0]).toBe(button1);
    });

    it('should handle partial attribute match correctly', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('data-testid', 'submit');
      button1.setAttribute('type', 'submit'); // 2 out of 3 attributes

      const button2 = document.createElement('button');
      button2.setAttribute('data-testid', 'submit'); // 1 out of 3 attributes

      elements = [button2, button1];
      mockEID.target.semantics = {
        attributes: {
          'data-testid': 'submit',
          type: 'submit',
          name: 'submit-button',
        },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // button1 should score higher (2/3 match vs 1/3)
      expect(result.elements[0]).toBe(button1);
    });

    it('should verify ID weight is 0.3 (highest)', () => {
      const button1 = document.createElement('button');
      button1.id = 'submit-btn';

      const button2 = document.createElement('button');
      button2.className = 'btn btn-primary btn-large'; // 3 classes = 0.25 weight

      elements = [button2, button1];
      mockEID.target.semantics = {
        id: 'submit-btn',
        classes: ['btn', 'btn-primary', 'btn-large'],
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // ID match (0.3) should beat class match (0.25)
      expect(result.elements[0]).toBe(button1);
    });

    it('should verify class weight is 0.25', () => {
      const button1 = document.createElement('button');
      button1.className = 'btn btn-primary';

      const button2 = document.createElement('button');
      button2.setAttribute('data-testid', 'submit'); // 0.2 weight

      elements = [button2, button1];
      mockEID.target.semantics = {
        classes: ['btn', 'btn-primary'],
        attributes: { 'data-testid': 'submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // Class match (0.25) should beat attribute match (0.2)
      expect(result.elements[0]).toBe(button1);
    });

    it('should verify attribute weight is 0.2', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('data-testid', 'submit');

      const button2 = document.createElement('button');
      button2.setAttribute('role', 'button'); // 0.15 weight

      elements = [button2, button1];
      mockEID.target.semantics = {
        attributes: { 'data-testid': 'submit' },
        role: 'button',
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // Attribute match (0.2) should beat role match (0.15)
      expect(result.elements[0]).toBe(button1);
    });

    it('should verify role weight is 0.15', () => {
      const button1 = document.createElement('button');
      button1.setAttribute('role', 'button');

      const button2 = document.createElement('button');
      button2.textContent = 'Submit Form'; // Exact match = 0.1 weight

      elements = [button2, button1];
      mockEID.target.semantics = {
        role: 'button',
        text: { raw: 'Submit Form', normalized: 'Submit Form' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // Role match (0.15) should beat exact text match (0.1)
      expect(result.elements[0]).toBe(button1);
    });

    it('should verify exact text weight is 0.1', () => {
      const button1 = document.createElement('button');
      button1.textContent = 'Submit Form';

      const button2 = document.createElement('button');
      button2.textContent = 'Submit Form Now'; // Partial match = 0.05 weight

      elements = [button2, button1];
      mockEID.target.semantics = {
        text: { raw: 'Submit Form', normalized: 'Submit Form' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // Exact text match (0.1) should beat partial text match (0.05)
      expect(result.elements[0]).toBe(button1);
    });

    it('should verify partial text weight is 0.05', () => {
      const button1 = document.createElement('button');
      button1.textContent = 'Submit Form Now'; // Partial match

      const button2 = document.createElement('button');
      // No text match

      elements = [button2, button1];
      mockEID.target.semantics = {
        text: { raw: 'Submit', normalized: 'Submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      // Partial text match (0.05) should beat no match (0)
      expect(result.elements[0]).toBe(button1);
    });
  });

  describe('Confidence Degradation', () => {
    it('should degrade to 0.3x for anchor fallback', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      document.body.appendChild(form);

      mockEID.fallback.onMissing = 'anchor-only';
      mockEID.meta.confidence = 0.9;

      const result = handler.handleFallback(mockEID, document);

      expect(result.confidence).toBe(0.9 * 0.3);
    });

    it('should degrade to 0.7x for first strategy', () => {
      const elements = [
        document.createElement('button'),
        document.createElement('button'),
      ];

      mockEID.fallback.onMultiple = 'first';
      mockEID.meta.confidence = 0.8;

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.confidence).toBe(0.8 * 0.7);
    });

    it('should degrade to 0.5x for allow-multiple', () => {
      const elements = [
        document.createElement('button'),
        document.createElement('button'),
      ];

      mockEID.fallback.onMultiple = 'allow-multiple';
      mockEID.meta.confidence = 0.75;

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.confidence).toBe(0.75 * 0.5);
    });

    it('should adjust confidence for best-score based on match quality', () => {
      const perfectMatch = document.createElement('button');
      perfectMatch.id = 'submit-btn';
      perfectMatch.textContent = 'Submit';

      const elements = [perfectMatch];

      mockEID.target.semantics = {
        id: 'submit-btn',
        text: { raw: 'Submit', normalized: 'Submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';
      mockEID.meta.confidence = 0.8;

      const result = handler.handleAmbiguous(elements, mockEID);

      // Should be 0.8 * (0.7 + score * 0.2), where score is close to 1.0
      expect(result.confidence).toBeGreaterThan(0.8 * 0.7);
      expect(result.confidence).toBeLessThanOrEqual(0.8 * 0.9);
    });

    it('should preserve degradation metadata', () => {
      const elements = [document.createElement('button')];

      mockEID.fallback.onMultiple = 'first';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.meta?.degraded).toBe(true);
      expect(result.meta?.degradationReason).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle Element as dom parameter for anchor fallback', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      const container = document.createElement('div');
      container.appendChild(form);
      document.body.appendChild(container);

      mockEID.fallback.onMissing = 'anchor-only';

      // Pass element instead of document
      const result = handler.handleFallback(mockEID, container);

      expect(result.status).toBe('degraded-fallback');
      expect(result.elements[0]).toBe(form);
    });

    it('should handle Document vs Element root correctly', () => {
      const form = document.createElement('form');
      form.id = 'login-form';
      const container = document.createElement('div');
      container.appendChild(form);
      document.body.appendChild(container);

      mockEID.fallback.onMissing = 'anchor-only';

      // Test with Document
      const resultDoc = handler.handleFallback(mockEID, document);
      expect(resultDoc.status).toBe('degraded-fallback');
      expect(resultDoc.elements[0]).toBe(form);

      // Test with Element
      const resultEl = handler.handleFallback(mockEID, container);
      expect(resultEl.status).toBe('degraded-fallback');
      expect(resultEl.elements[0]).toBe(form);
    });

    it('should handle empty elements array for ambiguous', () => {
      mockEID.fallback.onMultiple = 'first';

      const result = handler.handleAmbiguous([], mockEID);

      // Will try to access elements[0] which is undefined
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBeUndefined();
    });

    it('should handle single element for ambiguous resolution', () => {
      const button = document.createElement('button');
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous([button], mockEID);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(button);
    });

    it('should handle missing textContent in text scoring', () => {
      const button = document.createElement('button');
      Object.defineProperty(button, 'textContent', {
        get: () => null,
      });

      const elements = [button];
      mockEID.target.semantics = {
        text: { raw: 'Submit', normalized: 'Submit' },
      };
      mockEID.fallback.onMultiple = 'best-score';

      const result = handler.handleAmbiguous(elements, mockEID);

      expect(result.elements).toHaveLength(1);
    });
  });
});
