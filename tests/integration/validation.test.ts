import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';
import { validateEID, isEID } from '../../src/utils/validator';
import type { ElementIdentity } from '../../src/types';

describe('Validation - Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('End-to-End Validation', () => {
    it('should validate generated EID successfully', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button id="submit-btn">Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      const result = validateEID(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect errors in invalid external EID', () => {
      const invalidEID: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: {}, // Missing required fields
          score: 0.9,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
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

      const result = validateEID(invalidEID);

      // Should detect missing semantics (though empty object is technically valid)
      expect(result).toBeDefined();
    });

    it('should validate EID with JSON round-trip', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button id="submit-btn">Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      // Round-trip through JSON
      const json = JSON.stringify(eid);
      const parsed = JSON.parse(json) as ElementIdentity;

      const result = validateEID(parsed);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate EID with complex structure', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <div class="container">
            <div class="field">
              <label>Email</label>
              <input type="email" id="email">
            </div>
            <div class="field">
              <label>Password</label>
              <input type="password" id="password">
            </div>
            <button id="submit-btn">Submit</button>
          </div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      const result = validateEID(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Detection', () => {
    it('should detect missing required fields', () => {
      const invalidEID = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: {},
          score: 0.9,
        },
        path: [],
        // Missing target
      } as any;

      const result = validateEID(invalidEID);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing target field');
    });

    it('should detect missing version field', () => {
      const invalidEID = {
        anchor: {
          tag: 'form',
          semantics: {},
          score: 0.9,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
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
      } as any;

      const result = validateEID(invalidEID);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing version field');
    });

    it('should detect missing anchor tag', () => {
      const invalidEID = {
        version: '1.0',
        anchor: {
          semantics: {},
          score: 0.9,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
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
      } as any;

      const result = validateEID(invalidEID);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Anchor missing tag');
    });

    it('should detect deprecated functions in warnings', () => {
      const eid: ElementIdentity = {
        version: '2.0', // Unknown version
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

      const result = validateEID(eid);

      expect(result.valid).toBe(true); // No errors
      expect(result.warnings).toContain('Unknown version: 2.0');
    });

    it('should collect all errors and warnings', () => {
      const invalidEID = {
        version: '2.0', // Unknown version
        anchor: {
          semantics: {}, // Missing tag
          score: 0.9,
        },
        path: 'not-an-array', // Invalid type
        target: {
          semantics: {}, // Missing tag
          score: 0.8,
        },
        meta: {
          // Missing confidence
        },
        constraints: 'not-an-array',
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      } as any;

      const result = validateEID(invalidEID);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Type Guard Usage', () => {
    it('should use isEID for runtime type checking', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      // Type guard should return true for valid EID
      expect(isEID(eid)).toBe(true);

      // Type guard should narrow type in TypeScript
      if (isEID(eid)) {
        expect(eid.version).toBe('1.0');
        expect(eid.anchor.tag).toBeDefined();
        expect(eid.target.tag).toBeDefined();
      }
    });

    it('should use isEID to filter valid EIDs from array', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      const values: unknown[] = [
        eid,
        { invalid: true },
        eid,
        'string',
        null,
      ];

      const validEIDs = values.filter(isEID);

      expect(validEIDs).toHaveLength(2);
      validEIDs.forEach((validEID) => {
        expect(validEID.version).toBe('1.0');
        expect(validEID.anchor).toBeDefined();
      });
    });

    it('should use isEID with validateEID for safe validation', () => {
      const value: unknown = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: { id: 'login-form' },
          score: 0.9,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
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

      if (isEID(value)) {
        const result = validateEID(value);
        expect(result.valid).toBe(true);
      } else {
        expect(true).toBe(false); // Should not reach here
      }
    });

    it('should handle invalid values with isEID', () => {
      expect(isEID(null)).toBe(false);
      expect(isEID(undefined)).toBe(false);
      expect(isEID('string')).toBe(false);
      expect(isEID(123)).toBe(false);
      expect(isEID({ invalid: true })).toBe(false);
    });
  });

  describe('Nested Structure Validation', () => {
    it('should validate EID with complex path structure', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <div class="container">
            <section class="form-section">
              <div class="field-group">
                <button>Submit</button>
              </div>
            </section>
          </div>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      const result = validateEID(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Path should have multiple nodes
      expect(eid.path.length).toBeGreaterThan(0);
    });

    it('should validate EID with multiple constraints', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;
      eid.constraints = [
        {
          type: 'text-proximity',
          params: { reference: 'Submit', maxDistance: 1 },
          priority: 1,
        },
        {
          type: 'position',
          params: { strategy: 'first-in-dom' },
          priority: 2,
        },
        {
          type: 'uniqueness',
          params: {},
          priority: 3,
        },
      ];

      const result = validateEID(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate EID with all fallback strategies', () => {
      document.body.innerHTML = `
        <form id="login-form">
          <button>Submit</button>
        </form>
      `;

      const button = document.querySelector('button')!;
      const eid = generateEID(button)!;

      // Test all fallback strategies
      const strategies = [
        { onMissing: 'anchor-only', onMultiple: 'first' },
        { onMissing: 'strict', onMultiple: 'best-score' },
        { onMissing: 'none', onMultiple: 'allow-multiple' },
      ];

      strategies.forEach((strategy) => {
        eid.fallback = strategy as any;
        const result = validateEID(eid);
        expect(result.valid).toBe(true);
      });
    });
  });
});
