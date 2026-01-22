import type { Constraint } from '../types';

/**
 * Evaluates and applies constraints to candidates
 * Following SPECIFICATION.md §13.4
 */
export class ConstraintsEvaluator {
  /**
   * Applies a single constraint to candidates
   * @param candidates - Current candidate elements
   * @param constraint - Constraint to apply
   * @returns Filtered candidates
   */
  applyConstraint(candidates: Element[], constraint: Constraint): Element[] {
    switch (constraint.type) {
      case 'text-proximity':
        return this.applyTextProximity(
          candidates,
          constraint.params as { reference: string; maxDistance: number }
        );

      case 'position':
        return this.applyPosition(candidates, constraint.params as { strategy: string });

      case 'uniqueness':
      default:
        // Uniqueness doesn't filter, it's handled by the resolver
        return candidates;
    }
  }

  /**
   * Applies text proximity constraint using Levenshtein distance
   */
  private applyTextProximity(
    candidates: Element[],
    params: { reference: string; maxDistance: number }
  ): Element[] {
    return candidates.filter((el) => {
      const text = el.textContent?.trim() ?? '';
      const distance = this.levenshteinDistance(text, params.reference);
      return distance <= params.maxDistance;
    });
  }

  /**
   * Applies position constraint
   */
  private applyPosition(candidates: Element[], params: { strategy: string }): Element[] {
    if (candidates.length <= 1) return candidates;

    switch (params.strategy) {
      case 'first-in-dom':
        return [candidates[0]];

      case 'top-most':
        return [this.getTopMost(candidates)];

      case 'left-most':
        return [this.getLeftMost(candidates)];

      default:
        return [candidates[0]];
    }
  }

  /**
   * Gets the top-most element by bounding rect
   */
  private getTopMost(elements: Element[]): Element {
    return elements.reduce((top, el) => {
      try {
        const topRect = top.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        return elRect.top < topRect.top ? el : top;
      } catch {
        return top;
      }
    });
  }

  /**
   * Gets the left-most element by bounding rect
   */
  private getLeftMost(elements: Element[]): Element {
    return elements.reduce((left, el) => {
      try {
        const leftRect = left.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        return elRect.left < leftRect.left ? el : left;
      } catch {
        return left;
      }
    });
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    // Early exit for identical strings
    if (a === b) return 0;

    // Early exit for empty strings
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Use single-row optimization for memory efficiency
    const row: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        const current = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
        row[j - 1] = prev;
        prev = current;
      }
      row[b.length] = prev;
    }

    return row[b.length];
  }
}
