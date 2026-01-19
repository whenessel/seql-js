import type { ElementIdentity, ElementSemantics, ResolveResult } from '../types';
import { CssGenerator } from './css-generator';
import { normalizeText } from '../utils/text-normalizer';

/**
 * Handles resolution fallback scenarios
 * Following SPECIFICATION.md §13.5
 */
export class FallbackHandler {
  private cssGenerator: CssGenerator;

  constructor() {
    this.cssGenerator = new CssGenerator();
  }

  /**
   * Handles fallback when resolution fails
   * @param eid - Element Identity being resolved
   * @param dom - Document or element to search in
   * @returns Fallback resolution result
   */
  handleFallback(eid: ElementIdentity, dom: Document | Element): ResolveResult {
    const { onMissing } = eid.fallback;

    switch (onMissing) {
      case 'anchor-only':
        return this.fallbackToAnchor(eid, dom);

      case 'strict':
        return {
          status: 'error',
          elements: [],
          warnings: ['Element not found (strict mode)'],
          confidence: 0,
          meta: { degraded: true, degradationReason: 'strict-not-found' },
        };

      case 'none':
      default:
        return {
          status: 'error',
          elements: [],
          warnings: ['Element not found'],
          confidence: 0,
          meta: { degraded: true, degradationReason: 'not-found' },
        };
    }
  }

  /**
   * Attempts to find and return the anchor element as fallback
   */
  private fallbackToAnchor(
    eid: ElementIdentity,
    dom: Document | Element,
  ): ResolveResult {
    const anchorSelector = this.cssGenerator.buildAnchorSelector(eid);
    const root = dom instanceof Document ? dom : (dom.ownerDocument ?? dom);

    try {
      const anchor = root.querySelector(anchorSelector);

      if (anchor) {
        return {
          status: 'degraded-fallback',
          elements: [anchor],
          warnings: ['Target not found, returning anchor'],
          confidence: eid.meta.confidence * 0.3,
          meta: { degraded: true, degradationReason: 'anchor-fallback' },
        };
      }
    } catch (error) {
      // Log selector error for debugging
      const message =
        error instanceof Error ? error.message : 'Unknown selector error';
      return {
        status: 'error',
        elements: [],
        warnings: [`Invalid anchor selector: ${message}`],
        confidence: 0,
        meta: { degraded: true, degradationReason: 'invalid-anchor-selector' },
      };
    }

    return {
      status: 'error',
      elements: [],
      warnings: ['Anchor also not found'],
      confidence: 0,
      meta: { degraded: true, degradationReason: 'anchor-not-found' },
    };
  }

  /**
   * Handles ambiguous results (multiple matches)
   * @param elements - All matching elements
   * @param eid - Original Element Identity
   * @returns Resolution result based on fallback rules
   */
  handleAmbiguous(elements: Element[], eid: ElementIdentity): ResolveResult {
    const { onMultiple } = eid.fallback;

    switch (onMultiple) {
      case 'first':
        return {
          status: 'success',
          elements: [elements[0]],
          warnings: ['Multiple matches, returning first'],
          confidence: eid.meta.confidence * 0.7,
          meta: { degraded: true, degradationReason: 'first-of-multiple' },
        };

      case 'best-score':
        return this.selectBestScoring(elements, eid);

      case 'allow-multiple':
      default:
        return {
          status: 'ambiguous',
          elements,
          warnings: [`Multiple matches: ${elements.length}`],
          confidence: eid.meta.confidence * 0.5,
          meta: { degraded: true, degradationReason: 'multiple-matches' },
        };
    }
  }

  /**
   * Selects the best-scoring element from candidates
   * Re-scores each element based on semantic match quality
   */
  private selectBestScoring(
    elements: Element[],
    eid: ElementIdentity,
  ): ResolveResult {
    const targetSemantics = eid.target.semantics;
    let bestElement = elements[0];
    let bestScore = -1;

    for (const element of elements) {
      const score = this.scoreElementMatch(element, targetSemantics);
      if (score > bestScore) {
        bestScore = score;
        bestElement = element;
      }
    }

    return {
      status: 'success',
      elements: [bestElement],
      warnings: [
        `Multiple matches (${elements.length}), selected best-scoring element`,
      ],
      confidence: eid.meta.confidence * (0.7 + bestScore * 0.2),
      meta: { degraded: true, degradationReason: 'best-of-multiple' },
    };
  }

  /**
   * Scores how well an element matches the target semantics
   * @returns Score from 0 to 1
   */
  private scoreElementMatch(
    element: Element,
    targetSemantics: ElementSemantics,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Visibility boost (highest priority but non-exclusive)
    maxScore += 0.4;
    if (this.isVisible(element)) {
      score += 0.4;
    }

    // ID match (highest value)
    if (targetSemantics.id) {
      maxScore += 0.3;
      if (element.id === targetSemantics.id) {
        score += 0.3;
      }
    }

    // Class match
    if (targetSemantics.classes && targetSemantics.classes.length > 0) {
      maxScore += 0.25;
      const elementClasses = Array.from(element.classList);
      const matchCount = targetSemantics.classes.filter((cls) =>
        elementClasses.includes(cls),
      ).length;
      score += (matchCount / targetSemantics.classes.length) * 0.25;
    }

    // Attribute match
    if (targetSemantics.attributes) {
      const attrs = Object.entries(targetSemantics.attributes);
      if (attrs.length > 0) {
        maxScore += 0.2;
        let matchCount = 0;
        for (const [key, value] of attrs) {
          if (element.getAttribute(key) === value) {
            matchCount++;
          }
        }
        score += (matchCount / attrs.length) * 0.2;
      }
    }

    // Role match
    if (targetSemantics.role) {
      maxScore += 0.15;
      if (element.getAttribute('role') === targetSemantics.role) {
        score += 0.15;
      }
    }

    // Text match
    if (targetSemantics.text) {
      maxScore += 0.1;
      const elementText = normalizeText(element.textContent);
      if (elementText === targetSemantics.text.normalized) {
        score += 0.1;
      } else if (elementText.includes(targetSemantics.text.normalized)) {
        score += 0.05;
      }
    }

    // Normalize score if maxScore > 0
    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Checks if element is visible
   */
  private isVisible(element: Element): boolean {
    const htmlEl = element as HTMLElement;

    // Check inline styles first (more reliable in JSDOM)
    if (htmlEl.style) {
      if (htmlEl.style.display === 'none') return false;
      if (htmlEl.style.visibility === 'hidden') return false;
      if (htmlEl.style.opacity === '0') return false;
    }

    const doc = element.ownerDocument;
    if (!doc?.defaultView) return true;

    try {
      const style = doc.defaultView.getComputedStyle(element);

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    } catch {
      // getComputedStyle may fail in some contexts
      return true;
    }
  }
}
