import { describe, it, expect } from 'vitest';
import { validateEID, isEID } from '../../src/utils/validator';
import type { ElementIdentity } from '../../src/types';

describe('Validator', () => {
  let validEID: ElementIdentity;

  // Helper to create a valid EID for testing
  function createValidEID(): ElementIdentity {
    return {
      version: '1.0',
      anchor: {
        tag: 'form',
        semantics: { id: 'login-form' },
        score: 0.9,
      },
      path: [
        { tag: 'div', semantics: { classes: ['container'] }, score: 0.7 },
      ],
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
  }

  describe('validateEID', () => {
    describe('Version Validation', () => {
      it('should accept version "1.0"', () => {
        const eid = createValidEID();
        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should warn on unknown version', () => {
        const eid = createValidEID();
        eid.version = '2.0';

        const result = validateEID(eid);

        expect(result.valid).toBe(true); // No errors, just warning
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toContain('Unknown version: 2.0');
      });

      it('should error on missing version', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.version;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing version field');
      });
    });

    describe('Anchor Validation', () => {
      it('should error on missing anchor', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.anchor;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing anchor field');
      });

      it('should error on missing anchor tag', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.anchor.tag;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Anchor missing tag');
      });

      it('should error on missing anchor score', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.anchor.score;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Anchor missing score');
      });

      it('should error on missing anchor semantics', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.anchor.semantics;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Anchor missing semantics');
      });
    });

    describe('Target Validation', () => {
      it('should error on missing target', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.target;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing target field');
      });

      it('should error on missing target tag', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.target.tag;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target missing tag');
      });

      it('should error on missing target score', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.target.score;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target missing score');
      });

      it('should error on missing target semantics', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.target.semantics;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Target missing semantics');
      });
    });

    describe('Path Validation', () => {
      it('should error when path is not an array', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        eid.path = 'not-an-array';

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Path must be an array');
      });

      it('should accept empty path array', () => {
        const eid = createValidEID();
        eid.path = [];

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should error when path node missing tag', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        eid.path = [{ semantics: {}, score: 0.5 }];

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Path node 0 missing tag');
      });

      it('should error when path node missing semantics', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        eid.path = [{ tag: 'div', score: 0.5 }];

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Path node 0 missing semantics');
      });

      it('should validate all path nodes', () => {
        const eid = createValidEID();
        eid.path = [
          { tag: 'div', semantics: {}, score: 0.5 },
          // @ts-expect-error - Testing invalid state
          { semantics: {}, score: 0.6 }, // Missing tag
          // @ts-expect-error - Testing invalid state
          { tag: 'section', score: 0.7 }, // Missing semantics
        ];

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Path node 1 missing tag');
        expect(result.errors).toContain('Path node 2 missing semantics');
      });
    });

    describe('Meta Validation', () => {
      it('should error on missing meta', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.meta;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing meta field');
      });

      it('should warn on missing confidence score', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.meta.confidence;

        const result = validateEID(eid);

        expect(result.valid).toBe(true); // Warning, not error
        expect(result.warnings).toContain('Missing confidence score');
      });

      it('should warn on missing generatedAt timestamp', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.meta.generatedAt;

        const result = validateEID(eid);

        expect(result.valid).toBe(true); // Warning, not error
        expect(result.warnings).toContain('Missing generatedAt timestamp');
      });

      it('should accept valid meta with all fields', () => {
        const eid = createValidEID();
        eid.meta = {
          confidence: 0.95,
          generatedAt: Date.now(),
          degraded: true,
          degradationReason: 'test-reason',
        };

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Constraints Validation', () => {
      it('should warn when constraints is not an array', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        eid.constraints = 'not-an-array';

        const result = validateEID(eid);

        expect(result.valid).toBe(true); // Warning, not error
        expect(result.warnings).toContain('Constraints should be an array');
      });

      it('should accept empty constraints array', () => {
        const eid = createValidEID();
        eid.constraints = [];

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.warnings).not.toContain('Constraints should be an array');
      });

      it('should accept constraints with items', () => {
        const eid = createValidEID();
        eid.constraints = [
          { type: 'uniqueness', params: {}, priority: 1 },
          { type: 'text-proximity', params: { reference: 'test', maxDistance: 2 }, priority: 2 },
        ];

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Fallback Validation', () => {
      it('should warn on missing fallback', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.fallback;

        const result = validateEID(eid);

        expect(result.valid).toBe(true); // Warning, not error
        expect(result.warnings).toContain('Missing fallback rules');
      });

      it('should accept valid fallback rules', () => {
        const eid = createValidEID();
        eid.fallback = {
          onMissing: 'strict',
          onMultiple: 'best-score',
        };

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.warnings).not.toContain('Missing fallback rules');
      });
    });

    describe('Complete Validation', () => {
      it('should validate a complete valid EID', () => {
        const eid = createValidEID();

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should collect multiple errors', () => {
        const eid = createValidEID();
        // @ts-expect-error - Testing invalid state
        delete eid.anchor;
        // @ts-expect-error - Testing invalid state
        delete eid.target;
        // @ts-expect-error - Testing invalid state
        delete eid.meta;

        const result = validateEID(eid);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
        expect(result.errors).toContain('Missing anchor field');
        expect(result.errors).toContain('Missing target field');
        expect(result.errors).toContain('Missing meta field');
      });

      it('should collect multiple warnings', () => {
        const eid = createValidEID();
        eid.version = '2.0'; // Unknown version
        // @ts-expect-error - Testing invalid state
        delete eid.meta.confidence; // Missing confidence
        // @ts-expect-error - Testing invalid state
        delete eid.fallback; // Missing fallback

        const result = validateEID(eid);

        expect(result.valid).toBe(true); // No errors
        expect(result.warnings.length).toBeGreaterThanOrEqual(3);
        expect(result.warnings).toContain('Unknown version: 2.0');
        expect(result.warnings).toContain('Missing confidence score');
        expect(result.warnings).toContain('Missing fallback rules');
      });
    });
  });

  describe('isEID', () => {
    describe('Valid EID Checks', () => {
      it('should return true for valid EID', () => {
        const eid = createValidEID();

        expect(isEID(eid)).toBe(true);
      });

      it('should return true for minimal valid structure', () => {
        const minimal = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(minimal)).toBe(true);
      });
    });

    describe('Invalid Values', () => {
      it('should return false for null', () => {
        expect(isEID(null)).toBe(false);
      });

      it('should return false for undefined', () => {
        expect(isEID(undefined)).toBe(false);
      });

      it('should return false for non-object primitives', () => {
        expect(isEID('string')).toBe(false);
        expect(isEID(123)).toBe(false);
        expect(isEID(true)).toBe(false);
      });

      it('should return false for arrays', () => {
        expect(isEID([])).toBe(false);
        expect(isEID([1, 2, 3])).toBe(false);
      });
    });

    describe('Missing Required Fields', () => {
      it('should return false when missing version', () => {
        const obj = {
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when version is not string', () => {
        const obj = {
          version: 1.0,
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when missing anchor', () => {
        const obj = {
          version: '1.0',
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when anchor is not object', () => {
        const obj = {
          version: '1.0',
          anchor: 'not-an-object',
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when missing path', () => {
        const obj = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when path is not array', () => {
        const obj = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: 'not-an-array',
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when missing target', () => {
        const obj = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
        };

        expect(isEID(obj)).toBe(false);
      });

      it('should return false when target is not object', () => {
        const obj = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
          target: 'not-an-object',
        };

        expect(isEID(obj)).toBe(false);
      });
    });

    describe('TypeScript Type Narrowing', () => {
      it('should narrow type correctly in TypeScript', () => {
        const value: unknown = createValidEID();

        if (isEID(value)) {
          // TypeScript should know this is ElementIdentity now
          expect(value.version).toBe('1.0');
          expect(value.anchor.tag).toBe('form');
          expect(value.target.tag).toBe('button');
          expect(Array.isArray(value.path)).toBe(true);
        } else {
          // Should not reach here
          expect(true).toBe(false);
        }
      });

      it('should work with conditional flow', () => {
        const validValue: unknown = createValidEID();
        const invalidValue: unknown = { invalid: true };

        expect(isEID(validValue)).toBe(true);
        expect(isEID(invalidValue)).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty object', () => {
        expect(isEID({})).toBe(false);
      });

      it('should handle object with extra properties', () => {
        const obj = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
          extraProperty: 'should not affect validation',
        };

        expect(isEID(obj)).toBe(true);
      });

      it('should handle null values in object', () => {
        const obj = {
          version: '1.0',
          anchor: null,
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        // Note: typeof null === 'object' in JavaScript, so this passes the check
        // This is a known quirk but matches the actual implementation
        expect(isEID(obj)).toBe(true);
      });

      it('should handle undefined values in object', () => {
        const obj = {
          version: '1.0',
          anchor: undefined,
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        // undefined is not an object, so should fail
        expect(isEID(obj)).toBe(false);
      });

      it('should handle special values like NaN and Infinity', () => {
        const obj = {
          version: '1.0',
          anchor: { tag: 'div', semantics: {}, score: NaN },
          path: [],
          target: { tag: 'button', semantics: {}, score: Infinity },
        };

        // Should still pass isEID check (doesn't validate score values)
        expect(isEID(obj)).toBe(true);
      });

      it('should handle empty string version', () => {
        const obj = {
          version: '',
          anchor: { tag: 'div', semantics: {}, score: 0.5 },
          path: [],
          target: { tag: 'button', semantics: {}, score: 0.5 },
        };

        // Empty string is still a string, so should pass
        expect(isEID(obj)).toBe(true);
      });
    });

    describe('Nested Structure Validation', () => {
      it('should validate deeply nested path structures', () => {
        const eid = createValidEID();
        eid.path = [
          { tag: 'div', semantics: { classes: ['level1'] }, score: 0.5 },
          { tag: 'section', semantics: { id: 'level2' }, score: 0.6 },
          { tag: 'article', semantics: { role: 'main' }, score: 0.7 },
        ];

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate nested semantics in anchor', () => {
        const eid = createValidEID();
        eid.anchor.semantics = {
          id: 'form-id',
          classes: ['form-class'],
          attributes: { 'data-testid': 'test-form' },
          role: 'form',
          text: { raw: 'Login Form', normalized: 'Login Form' },
        };

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate nested semantics in target', () => {
        const eid = createValidEID();
        eid.target.semantics = {
          id: 'button-id',
          classes: ['btn', 'btn-primary'],
          attributes: { type: 'submit' },
          role: 'button',
          text: { raw: 'Submit', normalized: 'Submit' },
        };

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate nested constraints structure', () => {
        const eid = createValidEID();
        eid.constraints = [
          {
            type: 'text-proximity',
            params: { reference: 'Submit', maxDistance: 2 },
            priority: 1,
          },
          {
            type: 'position',
            params: { strategy: 'top-most' },
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

      it('should validate nested meta structure with all optional fields', () => {
        const eid = createValidEID();
        eid.meta = {
          confidence: 0.95,
          generatedAt: Date.now(),
          degraded: true,
          degradationReason: 'anchor-fallback',
        };

        const result = validateEID(eid);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('TypeScript Narrowing Edge Cases', () => {
      it('should narrow type in function parameter', () => {
        function processEID(value: unknown): string {
          if (isEID(value)) {
            // TypeScript should narrow to ElementIdentity
            return value.version;
          }
          return 'not-eid';
        }

        const eid = createValidEID();
        expect(processEID(eid)).toBe('1.0');
        expect(processEID('not-eid')).toBe('not-eid');
      });

      it('should narrow type in array filter', () => {
        const values: unknown[] = [
          createValidEID(),
          { invalid: true },
          createValidEID(),
          'string',
        ];

        const eids = values.filter(isEID);

        expect(eids).toHaveLength(2);
        // TypeScript should know eids is ElementIdentity[]
        eids.forEach((eid) => {
          expect(eid.version).toBeDefined();
          expect(eid.anchor).toBeDefined();
        });
      });

      it('should narrow type in switch statement', () => {
        const value: unknown = createValidEID();

        if (isEID(value)) {
          switch (value.version) {
            case '1.0':
              expect(value.anchor.tag).toBeDefined();
              break;
            default:
              break;
          }
        }
      });
    });
  });
});
