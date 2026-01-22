import type { GeneratorOptions } from '../types';
import {
  SEMANTIC_ANCHOR_TAGS,
  ROLE_ANCHOR_VALUES,
  MAX_PATH_DEPTH,
  ANCHOR_SCORE,
} from '../utils/constants';
import { isDynamicId } from '../utils/id-validator';
import type { EIDCache } from '../utils/eid-cache';

/**
 * Result of anchor finding
 */
export interface AnchorResult {
  element: Element;
  score: number;
  tier: 'A' | 'B' | 'C';
  depth: number;
}

/**
 * Finds semantic anchor for element identification
 * Traverses up from target to find semantic root
 * Following SPECIFICATION.md §7
 */
export class AnchorFinder {
  private maxDepth: number;
  private cache?: EIDCache;

  constructor(options: GeneratorOptions, cache?: EIDCache) {
    this.maxDepth = options.maxPathDepth ?? MAX_PATH_DEPTH;
    this.cache = cache;
  }

  /**
   * Finds the best anchor element for the target
   * @param target - Target element to find anchor for
   * @returns Anchor result or null if not found
   */
  findAnchor(target: Element): AnchorResult | null {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.getAnchor(target);
      if (cached !== undefined) {
        return cached;
      }
    }

    let current: Element | null = target.parentElement;
    let depth = 0;
    let bestCandidate: AnchorResult | null = null;

    while (current && depth < this.maxDepth) {
      // Check for body - stop here if reached (SPECIFICATION.md §7)
      if (current.tagName.toLowerCase() === 'body') {
        // Return best candidate if found, otherwise return body as degraded anchor
        if (bestCandidate) {
          return bestCandidate;
        }
        return {
          element: current,
          score: ANCHOR_SCORE.DEGRADED_SCORE,
          tier: 'C',
          depth,
        };
      }

      const rawScore = this.scoreAnchor(current);

      if (rawScore > 0) {
        // Apply depth penalty (SPECIFICATION.md §7)
        const score = this.applyDepthPenalty(rawScore, depth);
        const tier = this.getTier(current);
        const candidate: AnchorResult = { element: current, score, tier, depth };

        // Tier A is always best, stop immediately
        if (tier === 'A') {
          return candidate;
        }

        // Keep best candidate
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = candidate;
        }
      }

      current = current.parentElement;
      depth++;
    }

    const result = bestCandidate;

    // Cache the result
    if (this.cache) {
      this.cache.setAnchor(target, result);
    }

    return result;
  }

  /**
   * Scores an element as anchor candidate (without depth penalty)
   * @param element - Element to score
   * @returns Raw score from 0 to 1
   */
  scoreAnchor(element: Element): number {
    let score = 0;
    const tag = element.tagName.toLowerCase();

    // Tier A: Native semantic tags (highest weight)
    if (SEMANTIC_ANCHOR_TAGS.includes(tag)) {
      score += ANCHOR_SCORE.SEMANTIC_TAG;
    }

    // Tier B: Role-based semantics
    const role = element.getAttribute('role');
    if (role && ROLE_ANCHOR_VALUES.includes(role)) {
      score += ANCHOR_SCORE.ROLE;
    }

    // ARIA attributes bonus
    if (element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')) {
      score += ANCHOR_SCORE.ARIA_LABEL;
    }

    // Stable ID bonus
    const id = element.id;
    if (id && !isDynamicId(id)) {
      score += ANCHOR_SCORE.STABLE_ID;
    }

    // Tier C: Test markers (lower score)
    if (
      element.hasAttribute('data-testid') ||
      element.hasAttribute('data-qa') ||
      element.hasAttribute('data-test')
    ) {
      score += ANCHOR_SCORE.TEST_MARKER;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Applies depth penalty to score
   * Following SPECIFICATION.md §7: depthPenalty = (depth - threshold) * factor
   */
  private applyDepthPenalty(score: number, depth: number): number {
    if (depth <= ANCHOR_SCORE.DEPTH_PENALTY_THRESHOLD) {
      return score;
    }

    const penalty =
      (depth - ANCHOR_SCORE.DEPTH_PENALTY_THRESHOLD) * ANCHOR_SCORE.DEPTH_PENALTY_FACTOR;

    return Math.max(0, score - penalty);
  }

  /**
   * Determines the tier of an anchor element
   */
  private getTier(element: Element): 'A' | 'B' | 'C' {
    const tag = element.tagName.toLowerCase();

    if (SEMANTIC_ANCHOR_TAGS.includes(tag)) {
      return 'A';
    }

    const role = element.getAttribute('role');
    if (role && ROLE_ANCHOR_VALUES.includes(role)) {
      return 'B';
    }

    return 'C';
  }
}
