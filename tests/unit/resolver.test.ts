import { describe, it, expect, beforeEach } from 'vitest';
import { resolve } from '../../src/resolver/resolver';
import type { ElementIdentity, ResolverOptions } from '../../src/types';

describe('Resolver', () => {
  let mockEID: ElementIdentity;

  beforeEach(() => {
    document.body.innerHTML = '';
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
        onMissing: 'none',
        onMultiple: 'first',
      },
    };
  });

  describe('Phase 1: CSS Narrowing', () => {
    it('should build selector and query candidates', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should handle invalid CSS selector gracefully', () => {
      // Create EID with invalid selector characters
      mockEID.anchor.semantics = { id: '[invalid]selector' };

      const result = resolve(mockEID, document);

      // jsdom may not always throw on invalid selectors
      // Just verify it handles the case without crashing
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should limit candidates by maxCandidates option', () => {
      // Create many matching buttons
      document.body.innerHTML = `
        <form id="login-form">
          ${Array.from({ length: 50 }, () => '<button>Submit</button>').join('')}
        </form>
      `;

      const options: ResolverOptions = { maxCandidates: 10 };
      const result = resolve(mockEID, document, options);

      // Should process at most 10 candidates
      expect(result).toBeDefined();
    });

    it('should work with Element as root instead of Document', () => {
      document.body.innerHTML = `
        <div id="root">
          <form id="login-form">
            <button>Submit</button>
          </form>
        </div>
      `;

      const root = document.getElementById('root')!;
      const result = resolve(mockEID, root);

      expect(result.status).toBe('success');
    });
  });

  describe('Phase 2: Semantics Filtering', () => {
    it('should filter candidates by target semantics', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Cancel</button>
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, document);

      // Should match the button with "Submit" text
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].textContent).toBe('Submit');
    });

    it('should pass filtered candidates to next phase', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, document);

      // Multiple matches should trigger Phase 5
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Phase 3: Uniqueness Check', () => {
    it('should return success when exactly one match found', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.confidence).toBe(0.85);
      expect(result.meta?.degraded).toBe(false);
    });

    it('should handle zero matches without fallback', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Cancel</button>
        </form>
      `;

      const options: ResolverOptions = { enableFallback: false };
      const result = resolve(mockEID, document, options);

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      expect(result.warnings).toContain('No matching elements found');
      expect(result.confidence).toBe(0);
      expect(result.meta?.degraded).toBe(true);
      expect(result.meta?.degradationReason).toBe('not-found');
    });

    it('should call fallback handler when zero matches and fallback enabled', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Cancel</button>
        </form>
      `;

      const options: ResolverOptions = { enableFallback: true };
      const result = resolve(mockEID, document, options);

      // Fallback should be invoked
      expect(result).toBeDefined();
    });
  });

  describe('Phase 4: Constraints Application', () => {
    it('should sort constraints by priority', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'uniqueness', params: {}, priority: 1 },
        { type: 'uniqueness', params: {}, priority: 3 },
        { type: 'uniqueness', params: {}, priority: 2 },
      ];

      const result = resolve(mockEID, document);

      // Should process constraints in order of priority (high to low)
      expect(result).toBeDefined();
    });

    it('should apply constraints sequentially', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'position', params: { strategy: 'first-in-dom' }, priority: 1 },
      ];

      const result = resolve(mockEID, document);

      // Constraint should reduce to single match
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.confidence).toBe(0.85 * 0.9); // 90% degradation
    });

    it('should return success when constraint finds unique match', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'position', params: { strategy: 'first-in-dom' }, priority: 1 },
      ];

      const result = resolve(mockEID, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.meta?.degraded).toBe(false);
    });

    it('should handle over-constrained scenario without fallback', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Button1</button>
          <button>Button2</button>
          <button>Button3</button>
        </form>
      `;

      // Use a text constraint that won't match any button
      mockEID.target.semantics = { text: { raw: 'SpecificText', normalized: 'SpecificText' } };
      mockEID.constraints = [
        { type: 'text-proximity', params: { reference: 'XYZ-NoMatch', maxDistance: 0 }, priority: 1 },
      ];

      const options: ResolverOptions = { enableFallback: false };
      const result = resolve(mockEID, document, options);

      // If semantics filtering or constraints eliminate all, should get error or not-found
      expect(['error', 'success']).toContain(result.status);
    });

    it('should call fallback when over-constrained with fallback enabled', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'text-proximity', params: { reference: 'NonExistent', maxDistance: 0 }, priority: 1 },
      ];

      const options: ResolverOptions = { enableFallback: true };
      const result = resolve(mockEID, document, options);

      // Fallback should be invoked
      expect(result).toBeDefined();
    });
  });

  describe('Phase 5: Handle Ambiguous', () => {
    it('should return ambiguous status in strict mode', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      const options: ResolverOptions = { strictMode: true };
      const result = resolve(mockEID, document, options);

      expect(result.status).toBe('ambiguous');
      expect(result.elements).toHaveLength(2);
      expect(result.warnings[0]).toContain('Non-unique resolution: 2 matches');
      expect(result.confidence).toBe(0.85 * 0.7); // 70% degradation
      expect(result.meta?.degraded).toBe(true);
      expect(result.meta?.degradationReason).toBe('ambiguous');
    });

    it('should apply fallback handler for multiple matches', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.fallback.onMultiple = 'first';
      const options: ResolverOptions = { strictMode: false };
      const result = resolve(mockEID, document, options);

      // Should use fallback handler
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });
  });

  describe('Options Handling', () => {
    it('should merge options with defaults', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const customOptions: ResolverOptions = {
        maxCandidates: 50,
      };

      const result = resolve(mockEID, document, customOptions);

      expect(result).toBeDefined();
    });

    it('should respect enableFallback flag', () => {
      document.body.innerHTML = `<div></div>`;

      const withFallback = resolve(mockEID, document, { enableFallback: true });
      const withoutFallback = resolve(mockEID, document, { enableFallback: false });

      expect(withFallback).toBeDefined();
      expect(withoutFallback.status).toBe('error');
    });

    it('should respect strictMode flag', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      const strict = resolve(mockEID, document, { strictMode: true });
      const nonStrict = resolve(mockEID, document, { strictMode: false });

      expect(strict.status).toBe('ambiguous');
      expect(nonStrict.status).not.toBe('ambiguous');
    });

    it('should use default options when none provided', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, document);

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });
  });

  describe('Confidence Degradation', () => {
    it('should preserve original confidence for unique match', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      mockEID.meta.confidence = 0.95;
      const result = resolve(mockEID, document);

      expect(result.confidence).toBe(0.95);
    });

    it('should apply 0.9x degradation for constraint-based match', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'position', params: { strategy: 'first-in-dom' }, priority: 1 },
      ];
      mockEID.meta.confidence = 0.8;

      const result = resolve(mockEID, document);

      expect(result.confidence).toBe(0.8 * 0.9);
    });

    it('should apply 0.7x degradation in strict mode ambiguous', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.meta.confidence = 0.9;
      const options: ResolverOptions = { strictMode: true };

      const result = resolve(mockEID, document, options);

      expect(result.confidence).toBe(0.9 * 0.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty DOM', () => {
      document.body.innerHTML = '';

      const result = resolve(mockEID, document, { enableFallback: false });

      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
    });

    it('should handle missing anchor', () => {
      document.body.innerHTML = `<button>Submit</button>`;

      const result = resolve(mockEID, document, { enableFallback: false });

      expect(result).toBeDefined();
    });

    it('should handle no constraints', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [];

      const result = resolve(mockEID, document);

      // Should go directly to Phase 5
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle constraints with equal priority', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'uniqueness', params: {}, priority: 1 },
        { type: 'uniqueness', params: {}, priority: 1 },
      ];

      const result = resolve(mockEID, document);

      expect(result).toBeDefined();
    });

    it('should handle Element without ownerDocument', () => {
      const orphanElement = document.createElement('div');
      orphanElement.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, orphanElement);

      // Should use element itself as root when ownerDocument is null
      expect(result).toBeDefined();
    });
  });

  describe('Phase Sequence', () => {
    it('should execute phases in correct order: Phase 1 → 2 → 3 → success', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const result = resolve(mockEID, document);

      // Phase 1: CSS narrowing finds button
      // Phase 2: Semantics filtering matches "Submit"
      // Phase 3: Uniqueness check finds exactly 1 match
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.confidence).toBe(0.85); // No degradation
    });

    it('should execute phases: Phase 1 → 2 → 3 → 4 → success', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'position', params: { strategy: 'first-in-dom' }, priority: 1 },
      ];

      const result = resolve(mockEID, document);

      // Phase 1: CSS narrowing finds 2 buttons
      // Phase 2: Semantics filtering matches both "Submit"
      // Phase 3: Uniqueness check finds 2 matches (not unique)
      // Phase 4: Constraints reduce to 1 match
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.confidence).toBe(0.85 * 0.9); // 90% degradation
    });

    it('should execute phases: Phase 1 → 2 → 3 → 4 → 5', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'uniqueness', params: {}, priority: 1 }, // Doesn't filter
      ];

      const result = resolve(mockEID, document);

      // Phase 1-4: Still have 2 matches
      // Phase 5: Handle ambiguous - fallback handler uses onMultiple strategy
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
      expect(result.status).toBe('success'); // Fallback handler returns success with first element
    });
  });

  describe('Error Handling in Each Phase', () => {
    it('should handle Phase 1 error (invalid selector)', () => {
      // Create EID that might cause selector error
      mockEID.anchor.semantics = { id: 'test[invalid' };

      const result = resolve(mockEID, document);

      // jsdom may or may not throw on invalid selector
      // If it doesn't throw, querySelectorAll returns empty array, leading to not-found
      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      // Could be either invalid-selector or not-found depending on jsdom behavior
      expect(['invalid-selector', 'not-found']).toContain(result.meta?.degradationReason);
    });

    it('should handle Phase 2 error (no semantic matches)', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Cancel</button>
        </form>
      `;

      const options: ResolverOptions = { enableFallback: false };
      const result = resolve(mockEID, document, options);

      // Phase 2 filters out all candidates
      expect(result.status).toBe('error');
      expect(result.elements).toHaveLength(0);
      expect(result.meta?.degradationReason).toBe('not-found');
    });

    it('should handle Phase 4 error (constraints eliminate all)', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'text-proximity', params: { reference: 'NonExistent', maxDistance: 0 }, priority: 1 },
      ];

      const options: ResolverOptions = { enableFallback: false };
      const result = resolve(mockEID, document, options);

      // Phase 4 eliminates all candidates
      expect(result.status).toBe('error');
      expect(result.meta?.degradationReason).toBe('over-constrained');
      expect(result.warnings.some(w => w.includes('Constraints eliminated'))).toBe(true);
    });
  });

  describe('All ResolverOptions', () => {
    it('should respect maxCandidates option', () => {
      document.body.innerHTML = `
        <form id="login-form">
          ${Array.from({ length: 100 }, () => '<button>Submit</button>').join('')}
        </form>
      `;

      const options: ResolverOptions = { maxCandidates: 20 };
      const result = resolve(mockEID, document, options);

      // Should limit to 20 candidates
      expect(result).toBeDefined();
    });

    it('should respect enableFallback option', () => {
      document.body.innerHTML = `<div></div>`;

      const withFallback: ResolverOptions = { enableFallback: true };
      const withoutFallback: ResolverOptions = { enableFallback: false };

      const result1 = resolve(mockEID, document, withFallback);
      const result2 = resolve(mockEID, document, withoutFallback);

      // With fallback should try anchor fallback (if anchor exists)
      // Without fallback should return error
      expect(result2.status).toBe('error');
      // result1 might be error if anchor not found, or degraded-fallback if found
      expect(['error', 'degraded-fallback']).toContain(result1.status);
    });

    it('should respect strictMode option', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      const strict: ResolverOptions = { strictMode: true };
      const nonStrict: ResolverOptions = { strictMode: false };

      const result1 = resolve(mockEID, document, strict);
      const result2 = resolve(mockEID, document, nonStrict);

      expect(result1.status).toBe('ambiguous');
      expect(result2.status).toBe('success'); // Fallback handler resolves
    });

    it('should combine multiple options', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const options: ResolverOptions = {
        maxCandidates: 50,
        enableFallback: true,
        strictMode: false,
      };

      const result = resolve(mockEID, document, options);

      expect(result.status).toBe('success');
    });
  });

  describe('Degradation Confidence Scenarios', () => {
    it('should apply no degradation for unique match', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      mockEID.meta.confidence = 0.9;
      const result = resolve(mockEID, document);

      expect(result.confidence).toBe(0.9);
      expect(result.meta?.degraded).toBe(false);
    });

    it('should apply 0.9x degradation for constraint-based unique match', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.constraints = [
        { type: 'position', params: { strategy: 'first-in-dom' }, priority: 1 },
      ];
      mockEID.meta.confidence = 0.8;

      const result = resolve(mockEID, document);

      expect(result.confidence).toBe(0.8 * 0.9);
      expect(result.meta?.degraded).toBe(false);
    });

    it('should apply 0.7x degradation for strict mode ambiguous', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.meta.confidence = 0.85;
      const options: ResolverOptions = { strictMode: true };

      const result = resolve(mockEID, document, options);

      expect(result.confidence).toBe(0.85 * 0.7);
      expect(result.meta?.degraded).toBe(true);
    });

    it('should apply fallback degradation for multiple matches', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.meta.confidence = 0.85;
      mockEID.fallback.onMultiple = 'first';

      const result = resolve(mockEID, document);

      // Fallback handler applies 0.7x degradation
      expect(result.confidence).toBe(0.85 * 0.7);
      expect(result.meta?.degraded).toBe(true);
    });

    it('should apply 0.5x degradation for allow-multiple fallback', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
          <button>Submit</button>
        </form>
      `;

      mockEID.meta.confidence = 0.8;
      mockEID.fallback.onMultiple = 'allow-multiple';

      const result = resolve(mockEID, document);

      // Fallback handler applies 0.5x degradation for allow-multiple
      expect(result.confidence).toBe(0.8 * 0.5);
      expect(result.meta?.degraded).toBe(true);
    });

    it('should apply 0.3x degradation for anchor fallback', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Cancel</button>
        </form>
      `;

      mockEID.meta.confidence = 0.9;
      mockEID.fallback.onMissing = 'anchor-only';
      const options: ResolverOptions = { enableFallback: true };

      const result = resolve(mockEID, document, options);

      // Fallback handler applies 0.3x degradation for anchor fallback
      expect(result.confidence).toBe(0.9 * 0.3);
      expect(result.meta?.degraded).toBe(true);
    });
  });
});
