import type { ElementIdentity } from '../types';
import { CONFIDENCE_WEIGHTS } from './constants';

/**
 * Calculates overall confidence score for Element Identity
 * Following SPECIFICATION.md §13 confidence formula
 *
 * @param eid - The Element Identity to score
 * @param uniquenessBonus - Bonus for unique resolution (0-1), determined during resolution
 * @returns Confidence score from 0 to 1
 */
export function calculateConfidence(
  eid: ElementIdentity,
  uniquenessBonus: number = 0,
): number {
  const anchorScore = eid.anchor.score;

  const avgPathScore =
    eid.path.length > 0
      ? eid.path.reduce((sum, n) => sum + n.score, 0) / eid.path.length
      : 0.5;

  const targetScore = eid.target.score;

  // Weighted sum formula using constants
  const confidence =
    anchorScore * CONFIDENCE_WEIGHTS.ANCHOR +
    avgPathScore * CONFIDENCE_WEIGHTS.PATH +
    targetScore * CONFIDENCE_WEIGHTS.TARGET +
    uniquenessBonus * CONFIDENCE_WEIGHTS.UNIQUENESS;

  // Degradation penalty
  const degradationPenalty = eid.anchor.degraded ? 0.2 : 0;

  return Math.max(0, Math.min(1, confidence - degradationPenalty));
}

/**
 * Calculates score for a single element based on its semantic features
 * @param semanticsCount - Number of semantic features present
 * @param hasId - Whether element has stable ID
 * @param hasRole - Whether element has ARIA role
 * @returns Score from 0 to 1
 */
export function calculateElementScore(
  semanticsCount: number,
  hasId: boolean,
  hasRole: boolean,
): number {
  let score = 0.5; // Base score

  if (hasId) score += 0.2;
  if (hasRole) score += 0.15;

  // Each semantic feature adds to score
  score += Math.min(semanticsCount * 0.05, 0.15);

  return Math.min(score, 1.0);
}
