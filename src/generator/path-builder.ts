import type { PathNode, GeneratorOptions } from '../types';
import type { SemanticExtractor } from './semantic-extractor';
import { SEMANTIC_TAGS, MAX_PATH_DEPTH, PATH_SCORE } from '../utils/constants';
import { isUtilityClass } from '../utils/class-filter';
import { isDynamicId } from '../utils/id-validator';
import type { EIDCache } from '../utils/eid-cache';

// Fallback CSS escape function if not available
const cssEscape = (str: string) => {
  // Simplified CSS escape for special characters
  return str.replace(/([#:.[\]@])/g, '\\$1');
};

/**
 * Result of path building including degradation info
 */
export interface PathBuildResult {
  path: PathNode[];
  degraded: boolean;
  degradationReason?: string;
}

/**
 * Builds semantic path from anchor to target
 * Following SPECIFICATION.md §8
 */
export class PathBuilder {
  private maxDepth: number;
  private cache?: EIDCache;

  constructor(options: GeneratorOptions, cache?: EIDCache) {
    this.maxDepth = options.maxPathDepth ?? MAX_PATH_DEPTH;
    this.cache = cache;
  }

  /**
   * Builds path from anchor to target (excluding both)
   * @param anchor - Anchor element (start)
   * @param target - Target element (end)
   * @param extractor - Semantic extractor instance
   * @returns Path build result with nodes and degradation info
   */
  buildPath(
    anchor: Element,
    target: Element,
    extractor: SemanticExtractor,
  ): PathBuildResult {
    const rawPath: Element[] = [];
    let current: Element | null = target.parentElement;

    // Traverse up from target to anchor
    while (current && current !== anchor && rawPath.length < this.maxDepth) {
      rawPath.unshift(current); // Add to beginning (we're going backwards)
      current = current.parentElement;
    }

    // Check for depth overflow (SPECIFICATION.md §8)
    const depthOverflow = rawPath.length >= this.maxDepth && current !== anchor;

    // Filter noise elements, keeping semantic ones
    let filteredPath = this.filterNoise(rawPath);

    // Check uniqueness and add disambiguation nodes if needed (SPECIFICATION.md §8)
    filteredPath = this.ensureUniqueness(
      rawPath,
      filteredPath,
      anchor,
      target,
      extractor,
    );

    // Convert to PathNodes
    const pathNodes = filteredPath.map((el) => {
      // Calculate nth-child position (1-based index)
      const parent = el.parentElement;
      let nthChild: number | undefined;

      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(el);
        if (index !== -1) {
          nthChild = index + 1; // 1-based for CSS nth-child()
        }
      }

      return {
        tag: el.tagName.toLowerCase(),
        semantics: extractor.extract(el),
        score: extractor.scoreElement(el),
        nthChild,
      };
    });

    return {
      path: pathNodes,
      degraded: depthOverflow,
      degradationReason: depthOverflow ? 'path-depth-overflow' : undefined,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  buildPathNodes(
    anchor: Element,
    target: Element,
    extractor: SemanticExtractor,
  ): PathNode[] {
    return this.buildPath(anchor, target, extractor).path;
  }

  /**
   * Ensures path uniqueness by adding nodes if needed
   * Following SPECIFICATION.md §8 Disambiguation Algorithm
   */
  private ensureUniqueness(
    rawPath: Element[],
    filteredPath: Element[],
    anchor: Element,
    target: Element,
    extractor: SemanticExtractor,
  ): Element[] {
    // Build selector from current path and check uniqueness
    const selector = this.buildTestSelector(anchor, filteredPath, target);

    try {
      const doc = target.ownerDocument;
      if (!doc) return filteredPath;

      // Check cache first
      let matches: NodeListOf<Element> | Element[];
      if (this.cache) {
        const cached = this.cache.getSelectorResults(selector);
        if (cached !== undefined) {
          matches = cached;
        } else {
          matches = Array.from(doc.querySelectorAll(selector));
          this.cache.setSelectorResults(selector, matches);
        }
      } else {
        matches = doc.querySelectorAll(selector);
      }

      // If unique, return as-is
      if (matches.length <= 1) {
        return filteredPath;
      }

      // Not unique - try adding skipped nodes one by one
      const skippedNodes = rawPath.filter((el) => !filteredPath.includes(el));

      for (const node of skippedNodes) {
        // Only add if it has good semantic score
        const score = extractor.scoreElement(node);
        if (score < PATH_SCORE.MIN_CONFIDENCE_FOR_SKIP) {
          continue; // Skip low-value nodes
        }

        // Try adding this node
        const testPath = this.insertNodeInOrder(filteredPath, node, rawPath);
        const testSelector = this.buildTestSelector(anchor, testPath, target);

        try {
          // Check cache for test selector
          let testMatches: NodeListOf<Element> | Element[];
          if (this.cache) {
            const cached = this.cache.getSelectorResults(testSelector);
            if (cached !== undefined) {
              testMatches = cached;
            } else {
              testMatches = Array.from(doc.querySelectorAll(testSelector));
              this.cache.setSelectorResults(testSelector, testMatches);
            }
          } else {
            testMatches = doc.querySelectorAll(testSelector);
          }
          if (testMatches.length === 1) {
            return testPath; // Found unique path
          }
          if (testMatches.length < matches.length) {
            // Improved, continue with this path
            filteredPath = testPath;
          }
        } catch {
          // Invalid selector, skip this node
        }
      }

      return filteredPath;
    } catch {
      // querySelectorAll failed, return original
      return filteredPath;
    }
  }

  /**
   * Inserts node into path maintaining original order
   */
  private insertNodeInOrder(
    path: Element[],
    node: Element,
    rawPath: Element[],
  ): Element[] {
    const nodeIndex = rawPath.indexOf(node);
    const result = [...path];

    // Find insertion point
    let insertIndex = 0;
    for (let i = 0; i < result.length; i++) {
      const pathNodeIndex = rawPath.indexOf(result[i]);
      if (pathNodeIndex > nodeIndex) {
        break;
      }
      insertIndex = i + 1;
    }

    result.splice(insertIndex, 0, node);
    return result;
  }

  /**
   * Builds a test CSS selector from path
   */
  private buildTestSelector(
    anchor: Element,
    path: Element[],
    target: Element,
  ): string {
    const parts: string[] = [];

    // Anchor
    parts.push(this.elementToSelector(anchor));

    // Path
    for (const el of path) {
      parts.push(this.elementToSelector(el));
    }

    // Target
    parts.push(this.elementToSelector(target));

    return parts.join(' ');
  }

  /**
   * Converts element to basic CSS selector
   */
  private elementToSelector(element: Element): string {
    let selector = element.tagName.toLowerCase();

    if (element.id && !isDynamicId(element.id)) {
      selector += `#${cssEscape(element.id)}`;
    }

    for (const cls of Array.from(element.classList)) {
      if (!isUtilityClass(cls)) {
        selector += `.${cssEscape(cls)}`;
      }
    }

    return selector;
  }

  /**
   * Filters out noise/layout elements
   */
  private filterNoise(elements: Element[]): Element[] {
    return elements.filter((el) => this.shouldInclude(el));
  }

  /**
   * Determines if element should be included in path
   */
  shouldInclude(element: Element): boolean {
    const tag = element.tagName.toLowerCase();

    // Always include semantic HTML tags
    if (SEMANTIC_TAGS.includes(tag)) {
      return true;
    }

    // div/span need additional semantic features to be included
    if (tag === 'div' || tag === 'span') {
      return this.hasSemanticFeatures(element);
    }

    return false;
  }

  /**
   * Checks if element has meaningful semantic features
   */
  private hasSemanticFeatures(element: Element): boolean {
    // Has role attribute
    if (element.hasAttribute('role')) return true;

    // Has ARIA attributes
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('aria-')) return true;
    }

    // Has semantic classes (not just utility)
    if (element.classList.length > 0) {
      for (const cls of Array.from(element.classList)) {
        if (!isUtilityClass(cls)) return true;
      }
    }

    // Has data-testid or similar
    if (
      element.hasAttribute('data-testid') ||
      element.hasAttribute('data-qa') ||
      element.hasAttribute('data-test')
    ) {
      return true;
    }

    // Has stable ID
    const id = element.id;
    if (id && !isDynamicId(id)) {
      return true;
    }

    return false;
  }
}
