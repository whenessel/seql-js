import type { PathNode, GeneratorOptions } from '../types';
import type { SemanticExtractor } from './semantic-extractor';
import { SEMANTIC_TAGS, MAX_PATH_DEPTH, PATH_SCORE, ROOT_ELEMENTS } from '../utils/constants';
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
   * @remarks
   * Special handling for root elements:
   * - If anchor is html and target is head/body: returns empty path
   * - If anchor is html and target is inside head: builds path through head
   */
  buildPath(anchor: Element, target: Element, extractor: SemanticExtractor): PathBuildResult {
    const anchorTag = anchor.tagName.toLowerCase();
    const targetTag = target.tagName.toLowerCase();

    // Special case 1: anchor is html and target is head or body (direct children)
    if (anchorTag === 'html' && (targetTag === 'head' || targetTag === 'body')) {
      return {
        path: [],
        degraded: false,
      };
    }

    // Special case 2: anchor is html and target is inside head
    if (anchorTag === 'html' && this.isInsideHead(target)) {
      return this.buildHeadPath(anchor, target, extractor);
    }

    const rawPath: Element[] = [];
    let current: Element | null = target.parentElement;

    // Traverse up from target to anchor
    while (current && current !== anchor && rawPath.length < this.maxDepth) {
      rawPath.unshift(current); // Add to beginning (we're going backwards)
      current = current.parentElement;
    }

    // Check for depth overflow (SPECIFICATION.md §8)
    const depthOverflow = rawPath.length >= this.maxDepth && current !== anchor;

    // Validate that we actually reached the anchor (if not depth overflow)
    if (!depthOverflow && current !== anchor) {
      console.warn('[PathBuilder] Target is not a descendant of anchor');
      return {
        path: [],
        degraded: true,
        degradationReason: 'target-not-descendant-of-anchor',
      };
    }

    // Filter noise elements, keeping semantic ones
    let filteredPath = this.filterNoise(rawPath);

    // Check uniqueness and add disambiguation nodes if needed (SPECIFICATION.md §8)
    filteredPath = this.ensureUniqueness(rawPath, filteredPath, anchor, target, extractor);

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
  buildPathNodes(anchor: Element, target: Element, extractor: SemanticExtractor): PathNode[] {
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
    extractor: SemanticExtractor
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
  private insertNodeInOrder(path: Element[], node: Element, rawPath: Element[]): Element[] {
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
  private buildTestSelector(anchor: Element, path: Element[], target: Element): string {
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

  /**
   * Checks if element is inside <head> section.
   * Stops at <body> to avoid false positives.
   * @param element - Element to check
   * @returns True if element is inside head, false otherwise
   * @remarks
   * Traverses up the DOM tree until finding head or body.
   * Returns false if body is encountered first.
   */
  private isInsideHead(element: Element): boolean {
    let current: Element | null = element.parentElement;
    while (current) {
      const tag = current.tagName.toLowerCase();
      if (tag === 'head') return true;
      if (tag === 'body') return false;
      current = current.parentElement;
    }
    return false;
  }

  /**
   * Builds path from html to target through head element.
   * Always includes head in the path for correct CSS selector generation.
   * @param htmlElement - The html element (anchor)
   * @param target - Target element inside head
   * @param extractor - Semantic extractor instance
   * @returns Path build result with head and intermediate nodes
   * @example
   * For <html><head><meta name="description"></head></html>
   * Returns path: [head]
   */
  private buildHeadPath(
    htmlElement: Element,
    target: Element,
    extractor: SemanticExtractor
  ): PathBuildResult {
    const rawPath: Element[] = [];
    let current: Element | null = target.parentElement;

    // Build path from target up to html (excluding html itself)
    while (current && current !== htmlElement) {
      rawPath.unshift(current);
      current = current.parentElement;
    }

    // Validate that we reached html
    if (current !== htmlElement) {
      return {
        path: [],
        degraded: true,
        degradationReason: 'target-not-descendant-of-html',
      };
    }

    // For head elements, we always want to include head in path for correct selector
    // Path should be: [head, ...other elements]
    const headIndex = rawPath.findIndex((el) => el.tagName.toLowerCase() === 'head');

    if (headIndex === -1) {
      // Should not happen if isInsideHead was true, but handle gracefully
      return {
        path: [],
        degraded: true,
        degradationReason: 'head-not-found-in-path',
      };
    }

    // Convert all elements in path to PathNodes
    const pathNodes = rawPath.map((el) => {
      const parent = el.parentElement;
      let nthChild: number | undefined;

      if (parent) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(el);
        if (index !== -1) {
          nthChild = index + 1;
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
      degraded: false,
    };
  }
}
