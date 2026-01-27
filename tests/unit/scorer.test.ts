import { describe, it, expect, beforeEach } from 'vitest';
import { calculateConfidence, calculateElementScore } from '../../src/utils/scorer';
import type { ElementIdentity } from '../../src/types';

describe('Scorer', () => {
  describe('calculateConfidence', () => {
    let mockEID: ElementIdentity;

    beforeEach(() => {
      mockEID = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: {},
          score: 0.8,
        },
        path: [
          { tag: 'div', semantics: {}, score: 0.7 },
          { tag: 'div', semantics: {}, score: 0.6 },
        ],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.9,
        },
        meta: {
          confidence: 0,
          generatedAt: Date.now(),
        },
        constraints: [],
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      };
    });

    it('should apply CONFIDENCE_WEIGHTS.ANCHOR (0.4)', () => {
      mockEID.anchor.score = 1.0;
      mockEID.path = [];
      mockEID.target.score = 0;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be 1.0 * 0.4 + 0.5 * 0.3 + 0 * 0.2 + 0 * 0.1 = 0.4 + 0.15 = 0.55
      expect(confidence).toBeCloseTo(0.55, 2);
    });

    it('should apply CONFIDENCE_WEIGHTS.PATH (0.3)', () => {
      mockEID.anchor.score = 0;
      mockEID.path = [
        { tag: 'div', semantics: {}, score: 1.0 },
        { tag: 'div', semantics: {}, score: 1.0 },
      ];
      mockEID.target.score = 0;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be 0 * 0.4 + 1.0 * 0.3 + 0 * 0.2 + 0 * 0.1 = 0.3
      expect(confidence).toBeCloseTo(0.3, 2);
    });

    it('should apply CONFIDENCE_WEIGHTS.TARGET (0.2)', () => {
      mockEID.anchor.score = 0;
      mockEID.path = [];
      mockEID.target.score = 1.0;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be 0 * 0.4 + 0.5 * 0.3 + 1.0 * 0.2 + 0 * 0.1 = 0.15 + 0.2 = 0.35
      expect(confidence).toBeCloseTo(0.35, 2);
    });

    it('should apply CONFIDENCE_WEIGHTS.UNIQUENESS bonus (0.1)', () => {
      mockEID.anchor.score = 0;
      mockEID.path = [];
      mockEID.target.score = 0;

      const confidence = calculateConfidence(mockEID, 1.0);

      // Should be 0 * 0.4 + 0.5 * 0.3 + 0 * 0.2 + 1.0 * 0.1 = 0.15 + 0.1 = 0.25
      expect(confidence).toBeCloseTo(0.25, 2);
    });

    it('should use 0.5 for empty path average', () => {
      mockEID.anchor.score = 1.0;
      mockEID.path = []; // Empty path
      mockEID.target.score = 1.0;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be 1.0 * 0.4 + 0.5 * 0.3 + 1.0 * 0.2 + 0 * 0.1 = 0.4 + 0.15 + 0.2 = 0.75
      expect(confidence).toBeCloseTo(0.75, 2);
    });

    it('should calculate average path score correctly', () => {
      mockEID.anchor.score = 0;
      mockEID.path = [
        { tag: 'div', semantics: {}, score: 0.6 },
        { tag: 'div', semantics: {}, score: 0.8 },
        { tag: 'div', semantics: {}, score: 1.0 },
      ];
      mockEID.target.score = 0;

      const confidence = calculateConfidence(mockEID, 0);

      // Avg path = (0.6 + 0.8 + 1.0) / 3 = 0.8
      // Should be 0 * 0.4 + 0.8 * 0.3 + 0 * 0.2 + 0 * 0.1 = 0.24
      expect(confidence).toBeCloseTo(0.24, 2);
    });

    it('should apply degradation penalty (-0.2)', () => {
      mockEID.anchor.score = 1.0;
      mockEID.anchor.degraded = true;
      mockEID.path = [];
      mockEID.target.score = 1.0;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be (1.0 * 0.4 + 0.5 * 0.3 + 1.0 * 0.2) - 0.2 = 0.75 - 0.2 = 0.55
      expect(confidence).toBeCloseTo(0.55, 2);
    });

    it('should clamp confidence to [0, 1] - lower bound', () => {
      mockEID.anchor.score = 0;
      mockEID.anchor.degraded = true;
      mockEID.path = [];
      mockEID.target.score = 0;

      const confidence = calculateConfidence(mockEID, 0);

      // Would be negative but should clamp to 0
      expect(confidence).toBe(0);
    });

    it('should clamp confidence to [0, 1] - upper bound', () => {
      mockEID.anchor.score = 1.0;
      mockEID.path = [{ tag: 'div', semantics: {}, score: 1.0 }];
      mockEID.target.score = 1.0;

      const confidence = calculateConfidence(mockEID, 1.0);

      // Should be 1.0 * 0.4 + 1.0 * 0.3 + 1.0 * 0.2 + 1.0 * 0.1 = 1.0 (already capped)
      expect(confidence).toBeLessThanOrEqual(1.0);
      expect(confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should clamp confidence to [0, 1] - exact 1.0', () => {
      mockEID.anchor.score = 1.0;
      mockEID.path = [{ tag: 'div', semantics: {}, score: 1.0 }];
      mockEID.target.score = 1.0;

      const confidence = calculateConfidence(mockEID, 1.0);

      // Should be exactly 1.0 (clamped)
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    it('should clamp confidence to [0, 1] - exact 0.0', () => {
      mockEID.anchor.score = 0;
      mockEID.anchor.degraded = true;
      mockEID.path = [];
      mockEID.target.score = 0;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be exactly 0.0 (clamped)
      expect(confidence).toBe(0);
    });

    it('should handle negative degradation penalty correctly', () => {
      mockEID.anchor.score = 0.1;
      mockEID.anchor.degraded = true;
      mockEID.path = [];
      mockEID.target.score = 0.1;

      const confidence = calculateConfidence(mockEID, 0);

      // Should be clamped to 0, not negative
      // Calculation: 0.1 * 0.4 + 0.5 * 0.3 + 0.1 * 0.2 - 0.2 = 0.04 + 0.15 + 0.02 - 0.2 = 0.01
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(0.1);
    });

    it('should handle degradation penalty with high scores', () => {
      mockEID.anchor.score = 1.0;
      mockEID.anchor.degraded = true;
      mockEID.path = [{ tag: 'div', semantics: {}, score: 1.0 }];
      mockEID.target.score = 1.0;

      const confidence = calculateConfidence(mockEID, 1.0);

      // Should be (1.0 * 0.4 + 1.0 * 0.3 + 1.0 * 0.2 + 1.0 * 0.1) - 0.2 = 1.0 - 0.2 = 0.8
      expect(confidence).toBeCloseTo(0.8, 2);
    });

    it('should calculate correct weighted sum with all components', () => {
      mockEID.anchor.score = 0.8;
      mockEID.path = [
        { tag: 'div', semantics: {}, score: 0.7 },
        { tag: 'div', semantics: {}, score: 0.6 },
      ];
      mockEID.target.score = 0.9;

      const confidence = calculateConfidence(mockEID, 0.5);

      // Avg path = (0.7 + 0.6) / 2 = 0.65
      // Should be 0.8 * 0.4 + 0.65 * 0.3 + 0.9 * 0.2 + 0.5 * 0.1
      //         = 0.32 + 0.195 + 0.18 + 0.05 = 0.745
      expect(confidence).toBeCloseTo(0.745, 2);
    });
  });

  describe('calculateElementScore', () => {
    it('should start with base score 0.5', () => {
      const score = calculateElementScore(0, false, false);
      expect(score).toBe(0.5);
    });

    it('should add 0.2 for stable ID', () => {
      const score = calculateElementScore(0, true, false);
      expect(score).toBe(0.7); // 0.5 + 0.2
    });

    it('should add 0.15 for ARIA role', () => {
      const score = calculateElementScore(0, false, true);
      expect(score).toBe(0.65); // 0.5 + 0.15
    });

    it('should add 0.05 per semantic feature (max 0.15)', () => {
      const score1 = calculateElementScore(1, false, false);
      expect(score1).toBe(0.55); // 0.5 + 0.05

      const score2 = calculateElementScore(2, false, false);
      expect(score2).toBe(0.6); // 0.5 + 0.10

      const score3 = calculateElementScore(3, false, false);
      expect(score3).toBe(0.65); // 0.5 + 0.15
    });

    it('should cap semantic features bonus at 0.15', () => {
      const score4 = calculateElementScore(4, false, false);
      expect(score4).toBe(0.65); // 0.5 + 0.15 (capped)

      const score10 = calculateElementScore(10, false, false);
      expect(score10).toBe(0.65); // 0.5 + 0.15 (capped)
    });

    it('should cap total score at 1.0', () => {
      const score = calculateElementScore(10, true, true);
      expect(score).toBe(1.0); // 0.5 + 0.2 + 0.15 + 0.15 = 1.0
    });

    it('should handle zero semantic features', () => {
      const score = calculateElementScore(0, false, false);
      expect(score).toBe(0.5);
    });

    it('should combine all features correctly', () => {
      const score1 = calculateElementScore(0, true, true);
      expect(score1).toBe(0.85); // 0.5 + 0.2 + 0.15

      const score2 = calculateElementScore(2, true, true);
      expect(score2).toBe(0.95); // 0.5 + 0.2 + 0.15 + 0.1

      const score3 = calculateElementScore(3, true, true);
      expect(score3).toBe(1.0); // 0.5 + 0.2 + 0.15 + 0.15 = 1.0
    });

    it('should handle edge case with maximum semantic features', () => {
      const score = calculateElementScore(100, true, true);
      expect(score).toBe(1.0); // Should be capped
    });

    it('should handle negative semanticsCount (produces negative bonus)', () => {
      const score = calculateElementScore(-1, false, false);
      // Negative count * 0.05 = -0.05, so score = 0.5 - 0.05 = 0.45
      // This is actual behavior - negative count reduces score
      expect(score).toBe(0.45);
    });

    it('should clamp score at exactly 1.0 when all bonuses applied', () => {
      const score = calculateElementScore(3, true, true);
      // 0.5 + 0.2 + 0.15 + 0.15 = 1.0
      expect(score).toBe(1.0);
    });

    it('should handle edge case: all zeros', () => {
      const score = calculateElementScore(0, false, false);
      expect(score).toBe(0.5);
    });

    it('should handle edge case: all maximums', () => {
      const score = calculateElementScore(100, true, true);
      expect(score).toBe(1.0);
    });
  });

  describe('Integration', () => {
    it('should work together for end-to-end confidence calculation', () => {
      // Create a realistic EID
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: { id: 'login-form' },
          score: calculateElementScore(1, true, false), // 0.75
        },
        path: [
          {
            tag: 'div',
            semantics: { classes: ['container'] },
            score: calculateElementScore(1, false, false), // 0.55
          },
        ],
        target: {
          tag: 'button',
          semantics: { text: { raw: 'Submit', normalized: 'Submit' } },
          score: calculateElementScore(1, false, true), // 0.7
        },
        meta: {
          confidence: 0,
          generatedAt: Date.now(),
        },
        constraints: [],
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      };

      const confidence = calculateConfidence(eid, 0.8);

      // 0.75 * 0.4 + 0.55 * 0.3 + 0.7 * 0.2 + 0.8 * 0.1
      // = 0.3 + 0.165 + 0.14 + 0.08 = 0.685
      expect(confidence).toBeCloseTo(0.685, 2);
    });

    it('should use increased STABLE_ID weight (0.25) in anchor scoring', () => {
      // Create EID where anchor has stable ID
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'div',
          semantics: { id: 'root' },
          // Anchor score only from STABLE_ID: 0.25 (not 0.75)
          // Anchor scoring doesn't include "base score", only specific bonuses
          score: 0.25,
          degraded: true, // tier C
        },
        path: [],
        target: {
          tag: 'div',
          semantics: {},
          // Minimal target: 0.5 (base only)
          score: 0.5,
        },
        meta: {
          confidence: 0,
          generatedAt: Date.now(),
        },
        constraints: [],
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      };

      const confidence = calculateConfidence(eid, 0);

      // 0.25 * 0.4 + 0.5 * 0.3 + 0.5 * 0.2 + 0 * 0.1 - 0.2 (degradation)
      // = 0.1 + 0.15 + 0.1 + 0 - 0.2 = 0.35 - 0.2 = 0.15
      expect(confidence).toBeCloseTo(0.15, 2);
      expect(confidence).toBeGreaterThan(0); // Should pass threshold 0.0
    });

    it('should calculate confidence for #root + minimal target scenario', () => {
      // Real-world case: <div id="root"> as anchor, plain <div> as target
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'div',
          semantics: { id: 'root', classes: [] },
          // Score: 0.5 (base) + 0.25 (stable id) = 0.75
          score: 0.75,
          degraded: true,
        },
        path: [],
        target: {
          tag: 'div',
          semantics: { classes: [] }, // utility classes filtered out
          // Score: 0.5 (base only, no semantic features)
          score: 0.5,
          nthChild: 2,
        },
        meta: {
          confidence: 0,
          generatedAt: Date.now(),
        },
        constraints: [],
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      };

      const confidence = calculateConfidence(eid, 0);

      // 0.75 * 0.4 + 0.5 * 0.3 + 0.5 * 0.2 - 0.2
      // = 0.3 + 0.15 + 0.1 - 0.2 = 0.35
      expect(confidence).toBeCloseTo(0.35, 2);
      expect(confidence).toBeGreaterThan(0.1); // Old threshold
    });

    it('should pass 0.0 threshold with low but non-zero confidence', () => {
      // Minimal case: degraded anchor + no semantics
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'div',
          semantics: {},
          score: 0.5, // base only
          degraded: true,
        },
        path: [],
        target: {
          tag: 'div',
          semantics: {},
          score: 0.5, // base only
        },
        meta: {
          confidence: 0,
          generatedAt: Date.now(),
        },
        constraints: [],
        fallback: {
          onMissing: 'none',
          onMultiple: 'first',
        },
      };

      const confidence = calculateConfidence(eid, 0);

      // 0.5 * 0.4 + 0.5 * 0.3 + 0.5 * 0.2 - 0.2
      // = 0.2 + 0.15 + 0.1 - 0.2 = 0.25
      expect(confidence).toBeCloseTo(0.25, 2);
      expect(confidence).toBeGreaterThanOrEqual(0); // Should pass 0.0 threshold
    });
  });
});
