import type { ElementIdentity, ElementSemantics, PathNode } from '../types';
import { ATTRIBUTE_PRIORITY, IGNORED_ATTRIBUTES, SVG_CHILD_ELEMENTS } from '../utils/constants';
import { cleanAttributeValue } from '../utils/attribute-cleaner';
import { filterStableClasses } from '../utils/class-classifier';

/**
 * Options for selector building with uniqueness control
 */
export interface BuildSelectorOptions {
  /**
   * Enable uniqueness disambiguation for target element.
   * When true and base selector is not unique, adds:
   * 1. Extra stable classes (up to maxClasses)
   * 2. :nth-of-type(N) as last resort
   */
  ensureUnique?: boolean;

  /**
   * Maximum number of additional classes to add for disambiguation
   * @default 4
   */
  maxClasses?: number;

  /**
   * Root element for uniqueness check (defaults to document)
   */
  root?: Document | Element;
}

/**
 * Result of selector building with uniqueness info
 */
export interface BuildSelectorResult {
  /** Generated CSS selector */
  selector: string;
  /** Whether selector is unique in the given root */
  isUnique: boolean;
  /** Whether nth-of-type was added for disambiguation */
  usedNthOfType: boolean;
  /** Number of extra classes added for disambiguation */
  extraClassesAdded: number;
}

/**
 * Generates CSS selectors from Element Identity
 * Following SPECIFICATION.md §13.1
 *
 * Priority order (highest to lowest):
 * 1. ID (100)
 * 2. data-testid, data-qa, data-cy (95)
 * 3. aria-label (90)
 * 4. name (85)
 * 5. href, src (80) - semantic for <a>, <img>, etc.
 * 6. role (75)
 * 7. type (70)
 * 8. alt, title, for (60)
 * 9. Stable classes (35)
 * 10. nth-of-type (last resort, added when ensureUnique=true)
 */
export class CssGenerator {

  /**
   * Builds CSS selector from Element Identity
   * @param eid - Element Identity to convert
   * @param options - Optional uniqueness control settings
   * @returns CSS selector string (simple) or BuildSelectorResult (with options)
   */
  buildSelector(eid: ElementIdentity, options?: BuildSelectorOptions): string;
  buildSelector(
    eid: ElementIdentity,
    options: BuildSelectorOptions & { ensureUnique: true }
  ): BuildSelectorResult;
  buildSelector(
    eid: ElementIdentity,
    options?: BuildSelectorOptions
  ): string | BuildSelectorResult {
    // FIX 1: Check if anchor and target are the same element
    const isAnchorSameAsTarget =
      eid.path.length === 0 &&
      eid.anchor.tag === eid.target.tag &&
      JSON.stringify(eid.anchor.semantics) === JSON.stringify(eid.target.semantics);

    if (isAnchorSameAsTarget) {
      // Anchor and target are identical, use only target selector with full semantics
      const selector = this.buildNodeSelector(
        eid.target.tag,
        eid.target.semantics,
        { excludeClasses: false } // Include classes for same-element case
      );

      if (!options?.ensureUnique) {
        return selector;
      }

      // Apply uniqueness logic to the single selector
      return this.ensureUniqueSelector(selector, eid, options);
    }

    const parts: string[] = [];

    // FIX 2: Ensure anchor is unique before building full selector
    const anchorSelector = options?.ensureUnique
      ? this.ensureUniqueAnchor(eid, options.root ?? document)
      : this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);

    parts.push(anchorSelector);

    // Path
    for (const node of eid.path) {
      let nodeSelector = this.buildNodeSelector(node.tag, node.semantics);

      // Add nth-child if available in EID (for precise positioning)
      if (node.nthChild !== undefined) {
        // For table elements, always use nth-child for correct positioning
        const isTableElement = ['tr', 'td', 'th', 'thead', 'tbody', 'tfoot'].includes(node.tag);
        if (isTableElement) {
          nodeSelector += `:nth-child(${node.nthChild})`;
        } else {
          // For non-table elements, also use nth-child if available for precision
          nodeSelector += `:nth-child(${node.nthChild})`;
        }
      }

      parts.push(nodeSelector);
    }

    // Target (base selector without disambiguation)
    let targetBaseSelector = this.buildNodeSelector(
      eid.target.tag,
      eid.target.semantics,
      { excludeClasses: options?.ensureUnique } // Exclude classes initially if we need unique
    );

    // Add nth-child if available in EID (same logic as for path nodes)
    if (eid.target.nthChild !== undefined) {
      const isTableElement = ['tr', 'td', 'th', 'thead', 'tbody', 'tfoot'].includes(eid.target.tag);
      if (isTableElement) {
        targetBaseSelector += `:nth-child(${eid.target.nthChild})`;
      } else {
        // For non-table elements, also use nth-child if available for precision
        targetBaseSelector += `:nth-child(${eid.target.nthChild})`;
      }
    }

    parts.push(targetBaseSelector);

    // ENHANCED FIX: Use appropriate combinator based on element type and context
    const isSvgChild = this.isSvgChildElement(eid.target.tag);
    const hasSvgInPath = eid.path.some(node => node.tag === 'svg');

    let baseSelector: string;

    // For SVG children with svg in path: use descendant until svg, then child
    if (isSvgChild && hasSvgInPath) {
      const svgIndexInPath = eid.path.findIndex(node => node.tag === 'svg');
      if (svgIndexInPath !== -1) {
        // parts structure: [anchor, ...path nodes, target]
        // svgIndex in parts is svgIndexInPath + 1 (because anchor is at index 0)
        const svgIndexInParts = svgIndexInPath + 1;

        // Everything up to and including svg (use descendant combinator)
        const beforeAndIncludingSvg = parts.slice(0, svgIndexInParts + 1);
        // Everything after svg, excluding target (use child combinator)
        const afterSvgBeforeTarget = parts.slice(svgIndexInParts + 1, -1);
        // The target element
        const target = parts[parts.length - 1];

        // Build selector: descendant to svg, then child for everything inside svg
        if (afterSvgBeforeTarget.length > 0) {
          baseSelector = beforeAndIncludingSvg.join(' ') + ' > ' + afterSvgBeforeTarget.join(' > ') + ' > ' + target;
        } else {
          // Direct child of svg
          baseSelector = beforeAndIncludingSvg.join(' ') + ' > ' + target;
        }
      } else {
        baseSelector = parts.join(' ');
      }
    } else {
      // Default: use descendant combinator (space) for flexibility
      // This handles filtered intermediate elements correctly
      baseSelector = parts.join(' ');
    }

    // If uniqueness check not requested, return simple selector
    if (!options?.ensureUnique) {
      return baseSelector;
    }

    // For ensureUnique: first check if baseSelector is already unique
    const baseSelectorMatches = this.querySelectorSafe(baseSelector, options.root ?? document);

    if (baseSelectorMatches.length === 1) {
      // Base selector is already unique, use it
      return {
        selector: baseSelector,
        isUnique: true,
        usedNthOfType: baseSelector.includes(':nth-'),
        extraClassesAdded: 0,
      };
    }

    // If base selector finds 0 or multiple elements, try buildFullDomPathSelector
    if (baseSelectorMatches.length === 0 || baseSelectorMatches.length > 1) {
      const fullPathSelector = this.buildFullDomPathSelector(
        eid,
        eid.target.semantics,
        options.root ?? document
      );

      if (fullPathSelector && this.isUnique(fullPathSelector, options.root ?? document)) {
        return {
          selector: fullPathSelector,
          isUnique: true,
          usedNthOfType: fullPathSelector.includes(':nth-'),
          extraClassesAdded: 0,
        };
      }
    }

    // Fallback: use regular ensureUniqueSelector logic with baseSelector
    return this.ensureUniqueSelector(
      baseSelector,
      eid,
      options
    );
  }

  /**
   * Builds selector for anchor only (used in fallback)
   * @param eid - Element Identity
   * @returns CSS selector for anchor
   */
  buildAnchorSelector(eid: ElementIdentity): string {
    return this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);
  }

  /**
   * Ensures selector uniqueness by progressively adding classes and nth-of-type
   */
  private ensureUniqueSelector(
    baseSelector: string,
    eid: ElementIdentity,
    options: BuildSelectorOptions
  ): BuildSelectorResult {
    const root = options.root ?? document;
    const maxClasses = options.maxClasses ?? 4;
    const targetTag = eid.target.tag;
    const targetSemantics = eid.target.semantics;

    let currentSelector = baseSelector;
    let extraClassesAdded = 0;
    let usedNthOfType = false;

    // Step 0: Check if base selector finds ANY elements
    // If not, the path is incomplete (div elements were filtered out)
    const baseMatches = this.querySelectorSafe(currentSelector, root);

    if (baseMatches.length === 0) {
      // Path is broken - try to find actual DOM path from anchor to target
      const fullPathSelector = this.buildFullDomPathSelector(eid, targetSemantics, root);
      if (fullPathSelector) {
        currentSelector = fullPathSelector;
        // Check if full path selector is unique
        if (this.isUnique(currentSelector, root)) {
          return {
            selector: currentSelector,
            isUnique: true,
            usedNthOfType: false,
            extraClassesAdded: 0,
          };
        }
      }
    }

    // Check if base selector is already unique
    if (this.isUnique(currentSelector, root)) {
      return {
        selector: currentSelector,
        isUnique: true,
        usedNthOfType: false,
        extraClassesAdded: 0,
      };
    }

    // Step 1: Try adding stable classes from target one by one (up to maxClasses)
    const availableTargetClasses = filterStableClasses(targetSemantics.classes ?? []);
    for (let i = 0; i < Math.min(availableTargetClasses.length, maxClasses); i++) {
      const cls = availableTargetClasses[i];
      currentSelector += `.${this.escapeCSS(cls)}`;
      extraClassesAdded++;

      if (this.isUnique(currentSelector, root)) {
        return {
          selector: currentSelector,
          isUnique: true,
          usedNthOfType: false,
          extraClassesAdded,
        };
      }
    }

    // Step 1.5: If still not unique, try buildFullDomPathSelector
    // This handles cases where multiple sections have same structure (e.g., multiple ul > li > span)
    if (!this.isUnique(currentSelector, root)) {
      const fullPathSelector = this.buildFullDomPathSelector(eid, targetSemantics, root);
      if (fullPathSelector && this.isUnique(fullPathSelector, root)) {
        return {
          selector: fullPathSelector,
          isUnique: true,
          usedNthOfType: fullPathSelector.includes(':nth-of-type('),
          extraClassesAdded,
        };
      }
    }

    // Step 2: Last resort - add :nth-of-type or :nth-child (table-aware)
    const targetElement = this.findNthElementByText(currentSelector, targetSemantics, root);
    if (targetElement) {
      currentSelector += this.getNthSelector(targetElement, targetTag);
      usedNthOfType = true;  // Note: might be nth-child for table elements
    }

    return {
      selector: currentSelector,
      isUnique: this.isUnique(currentSelector, root),
      usedNthOfType,
      extraClassesAdded,
    };
  }

  /**
   * Builds full DOM path selector by traversing actual DOM from anchor
   * This handles cases where intermediate div/span elements were filtered out
   */
  private buildFullDomPathSelector(
    eid: ElementIdentity,
    targetSemantics: ElementSemantics,
    root: Document | Element
  ): string | null {
    // First, find the anchor element
    const anchorSelector = this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);
    const anchors = this.querySelectorSafe(anchorSelector, root);

    if (anchors.length === 0) return null;

    // For each anchor, try to find the target within it
    for (const anchor of anchors) {
      // Find target candidates within this anchor
      const targetCandidates = this.findTargetWithinAnchor(
        anchor,
        eid.target.tag,
        targetSemantics
      );

      if (targetCandidates.length === 0) continue;

      // FIX: Score each candidate by how well its path matches EID path
      // This handles cases where multiple elements have same text (e.g., calendar dates)
      const scoredCandidates = targetCandidates.map(candidate => {
        const score = this.scorePathMatch(candidate, anchor, eid.path);
        return { element: candidate, score };
      });

      // Sort by score (highest first)
      scoredCandidates.sort((a, b) => b.score - a.score);

      // Try candidates in order of best match
      for (const { element } of scoredCandidates) {
        const pathSelector = this.buildPathFromAnchorToTarget(
          anchor,
          element,
          eid,
          root
        );

        if (pathSelector && this.isUnique(pathSelector, root)) {
          return pathSelector;
        }
      }
    }

    return null;
  }

  /**
   * Scores how well a candidate's DOM path matches the EID path
   * Compares tags, classes, attributes, and nthChild positions
   * @param candidate - Target element candidate
   * @param anchor - Anchor element
   * @param eidPath - EID path nodes
   * @returns Score (higher = better match)
   */
  private scorePathMatch(
    candidate: Element,
    anchor: Element,
    eidPath: PathNode[]
  ): number {
    // Build actual DOM path from anchor to candidate
    const domPath: Element[] = [];
    let el: Element | null = candidate.parentElement;

    while (el && el !== anchor) {
      domPath.unshift(el);
      el = el.parentElement;
    }

    let score = 0;
    const minLength = Math.min(domPath.length, eidPath.length);

    // Compare each level of the path
    for (let i = 0; i < minLength; i++) {
      const domEl = domPath[i];
      const eidNode = eidPath[i];

      // Match tag (most important)
      if (domEl.tagName.toLowerCase() === eidNode.tag) {
        score += 10;

        // Match nthChild position (very important for tables)
        if (eidNode.nthChild !== undefined) {
          const parent = domEl.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children);
            const actualNthChild = siblings.indexOf(domEl) + 1;
            if (actualNthChild === eidNode.nthChild) {
              score += 20; // High weight for position match
            } else {
              score -= 10; // Penalty for position mismatch
            }
          }
        }
      } else {
        score -= 5; // Penalty for tag mismatch
      }

      // Match classes if present in EID
      if (eidNode.semantics.classes && eidNode.semantics.classes.length > 0) {
        const matchingClasses = eidNode.semantics.classes.filter(
          (cls: string) => domEl.classList.contains(cls)
        );
        score += matchingClasses.length * 2;
      }

      // Match attributes if present in EID
      if (eidNode.semantics.attributes) {
        const matchingAttrs = Object.entries(eidNode.semantics.attributes).filter(
          ([name, value]) => domEl.getAttribute(name) === value
        );
        score += matchingAttrs.length * 3;
      }
    }

    // Penalty if path lengths don't match
    const lengthDiff = Math.abs(domPath.length - eidPath.length);
    score -= lengthDiff * 2;

    return score;
  }

  /**
   * Finds target elements within an anchor by matching semantics
   */
  private findTargetWithinAnchor(
    anchor: Element,
    targetTag: string,
    targetSemantics: ElementSemantics
  ): Element[] {
    const candidates = Array.from(anchor.querySelectorAll(targetTag));

    // Filter by semantics
    return candidates.filter(el => {
      // Match by text if available
      if (targetSemantics.text) {
        const elText = el.textContent?.trim() || '';
        const normalized = targetSemantics.text.normalized;
        if (!elText.includes(normalized) && !normalized.includes(elText)) {
          return false;
        }
      }

      // Match by classes if available
      if (targetSemantics.classes && targetSemantics.classes.length > 0) {
        const hasAllClasses = targetSemantics.classes.every(
          cls => el.classList.contains(cls)
        );
        if (hasAllClasses) return true;
      }

      // Match by attributes if available
      if (targetSemantics.attributes) {
        const matchesAttrs = Object.entries(targetSemantics.attributes).every(
          ([name, value]) => {
            const attrValue = el.getAttribute(name);
            if (name === 'href' || name === 'src') {
              return cleanAttributeValue(name, attrValue || '') ===
                     cleanAttributeValue(name, value);
            }
            return attrValue === value;
          }
        );
        if (matchesAttrs) return true;
      }

      // If we have text match, that's sufficient
      if (targetSemantics.text) return true;

      return false;
    });
  }

  /**
   * Disambiguates a parent element by trying attributes, classes, then nth-of-type
   * Priority: stable attributes > one stable class > nth-of-type
   * @param element The DOM element to disambiguate
   * @param tag The tag name
   * @param pathNode EID path node with semantics (if available)
   * @param fullPath Current selector path (for uniqueness testing)
   * @param root Root element for queries
   * @returns Disambiguated selector part (e.g., "div[role='main']" or "div.sidebar" or "div:nth-of-type(3)")
   */
  private disambiguateParent(
    element: Element,
    tag: string,
    pathNode: { tag: string; semantics: ElementSemantics } | null,
    fullPath: string[],
    root: Document | Element
  ): string {
    // 1. Try with stable attributes from DSL (if available)
    if (pathNode?.semantics?.attributes) {
      const parentWithAttrs = this.buildNodeSelector(tag, pathNode.semantics, {
        excludeClasses: true
      });

      // Check if adding attributes reduces ambiguity
      const baseSelector = [...fullPath, tag].join(' > ');
      const baseCandidates = this.querySelectorSafe(baseSelector, root);

      const attrSelector = [...fullPath, parentWithAttrs].join(' > ');
      const attrCandidates = this.querySelectorSafe(attrSelector, root);

      if (attrCandidates.length > 0 && attrCandidates.length < baseCandidates.length) {
        return parentWithAttrs;
      }
    }

    // 2. Try with ONE stable class (if available and NOT utility)
    if (pathNode?.semantics?.classes) {
      const stableClasses = filterStableClasses(pathNode.semantics.classes);

      if (stableClasses.length > 0) {
        const parentWithClass = `${tag}.${this.escapeCSS(stableClasses[0])}`;

        // Check if adding class reduces ambiguity
        const baseSelector = [...fullPath, tag].join(' > ');
        const baseCandidates = this.querySelectorSafe(baseSelector, root);

        const classSelector = [...fullPath, parentWithClass].join(' > ');
        const classCandidates = this.querySelectorSafe(classSelector, root);

        if (classCandidates.length > 0 && classCandidates.length < baseCandidates.length) {
          return parentWithClass;
        }
      }
    }

    // 3. Fall back to nth-of-type
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        s => s.tagName.toLowerCase() === tag
      );

      if (siblings.length > 1) {
        return `${tag}${this.getNthSelector(element, tag)}`;
      }
    }

    return tag;
  }

  /**
   * Builds CSS selector path from anchor to target by traversing actual DOM
   */
  private buildPathFromAnchorToTarget(
    anchor: Element,
    target: Element,
    eid: ElementIdentity,
    root: Document | Element
  ): string | null {
    // Build path from target up to anchor
    const pathElements: Element[] = [];
    let current: Element | null = target;

    while (current && current !== anchor) {
      pathElements.unshift(current);
      current = current.parentElement;
    }

    if (current !== anchor) {
      // Target is not a descendant of anchor
      return null;
    }

    // NEW STRATEGY ORDER:
    // 0. anchor path target[attrs_only] - simplest, no classes
    // 1. anchor > parent[attrs|class|nth] > target[attrs_only] - child combinator with smart parent disambiguation
    // 2. anchor parent[attrs|class|nth] target[attrs_only] - descendant combinator with smart parent disambiguation
    // 3. anchor path target[attrs + 1_stable_class] - add ONE stable class to target
    // 4. anchor path target[attrs]:nth-of-type(N) - last resort, nth on target

    const strategies = [
      // ============================================================
      // Strategy 0: anchor path target[attrs_only]
      // Most flexible - no classes on target, only semantic attributes
      // ============================================================
      () => {
        const anchorSelector = this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);
        const targetTag = eid.target.tag;
        const targetSemantics = eid.target.semantics;

        // Build path: anchor > meaningful_tags > target
        const meaningfulTags: string[] = [];
        for (const pathNode of eid.path) {
          meaningfulTags.push(pathNode.tag);
        }

        // Check if this simplified path is unique
        const parts = [anchorSelector, ...meaningfulTags, targetTag].filter(Boolean);
        const simplePath = parts.join(' ');

        if (this.isUnique(simplePath, root)) {
          return simplePath;
        }

        // Try adding target semantics (ONLY attributes, NO classes)
        const targetSelector = this.buildNodeSelector(targetTag, targetSemantics, {
          excludeClasses: true // KEY: no classes on target in Strategy 0
        });
        const simplePathWithSemantics = [anchorSelector, ...meaningfulTags.slice(0, -1), targetSelector].join(' ');

        if (this.isUnique(simplePathWithSemantics, root)) {
          return simplePathWithSemantics;
        }

        return null;
      },

      // ============================================================
      // Strategy 1: anchor > parent[attrs|class|nth] > target[attrs_only]
      // Full path with '>' combinator
      // Parents: disambiguated using attrs > stable class > nth-of-type
      // Target: ONLY attributes, NO classes
      // ============================================================
      () => {
        const fullPath = [this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics)];

        // Build a mapping from pathElements to eid.path nodes by tag matching
        const pathNodeMap = new Map<Element, { tag: string; semantics: ElementSemantics } | null>();
        let eidPathIndex = 0;

        for (let i = 0; i < pathElements.length - 1; i++) {
          const el = pathElements[i];
          const tag = el.tagName.toLowerCase();

          // Try to match with next eid.path node
          if (eidPathIndex < eid.path.length && eid.path[eidPathIndex].tag === tag) {
            pathNodeMap.set(el, eid.path[eidPathIndex]);
            eidPathIndex++;
          } else {
            pathNodeMap.set(el, null);
          }
        }

        for (let i = 0; i < pathElements.length; i++) {
          const el = pathElements[i];
          const tag = el.tagName.toLowerCase();

          // For intermediate nodes (parents), use smart disambiguation
          if (i < pathElements.length - 1) {
            const pathNode = pathNodeMap.get(el) || null;
            const disambiguated = this.disambiguateParent(el, tag, pathNode, fullPath, root);
            fullPath.push(disambiguated);
            continue;
          }

          // For target: ONLY attrs, NO classes (Strategy 1 should not add classes to target)
          const targetSelector = this.buildNodeSelector(
            eid.target.tag,
            eid.target.semantics,
            { excludeClasses: true } // KEY: no classes on target
          );

          // For table elements, add nth-child if there are siblings with same tag
          const parent = el.parentElement;
          if (parent && ['td', 'th', 'tr', 'thead', 'tbody', 'tfoot'].includes(tag)) {
            const siblings = Array.from(parent.children).filter(
              s => s.tagName.toLowerCase() === tag
            );
            if (siblings.length > 1) {
              fullPath.push(`${targetSelector}${this.getNthSelector(el, tag)}`);
            } else {
              fullPath.push(targetSelector);
            }
          } else {
            fullPath.push(targetSelector);
          }
        }

        const selector = fullPath.join(' > ');
        return this.isUnique(selector, root) ? selector : null;
      },

      // ============================================================
      // Strategy 2: anchor parent[attrs|class|nth] target[attrs_only]
      // Descendant combinator (space) - more flexible
      // Parents: disambiguated using attrs > stable class > nth-of-type
      // Target: ONLY attributes, NO classes
      // ============================================================
      () => {
        const anchorSelector = this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);
        const parts = [anchorSelector];

        // Build path from EID nodes, using smart disambiguation for parents
        for (let i = 0; i < pathElements.length - 1; i++) {
          const el = pathElements[i];
          const tag = el.tagName.toLowerCase();
          const pathNode = eid.path[i] || null;

          // Check if this path node is ambiguous under current selector
          const tempSelector = parts.join(' ') + ' ' + tag;
          const candidates = this.querySelectorSafe(tempSelector, root);

          if (candidates.length > 1) {
            // Need disambiguation
            // First try with attributes/class from disambiguateParent logic
            if (pathNode?.semantics?.attributes) {
              const parentWithAttrs = this.buildNodeSelector(tag, pathNode.semantics, {
                excludeClasses: true
              });
              const testSelector = parts.join(' ') + ' ' + parentWithAttrs;

              if (this.querySelectorSafe(testSelector, root).length === 1 ||
                  this.querySelectorSafe(testSelector + ' ' + eid.target.tag, root).length === 1) {
                parts.push(parentWithAttrs);
                continue;
              }
            }

            // Try with stable class
            if (pathNode?.semantics?.classes) {
              const stableClasses = filterStableClasses(pathNode.semantics.classes);
              if (stableClasses.length > 0) {
                const parentWithClass = `${tag}.${this.escapeCSS(stableClasses[0])}`;
                const testSelector = parts.join(' ') + ' ' + parentWithClass;

                if (this.querySelectorSafe(testSelector, root).length === 1 ||
                    this.querySelectorSafe(testSelector + ' ' + eid.target.tag, root).length === 1) {
                  parts.push(parentWithClass);
                  continue;
                }
              }
            }

            // Fall back to nth-of-type
            // Find the actual element in pathElements that matches this EID path node
            const matchingPathEl = pathElements[i];
            const parent = matchingPathEl.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter(
                s => s.tagName.toLowerCase() === tag
              );
              if (siblings.length > 1) {
                parts.push(`${tag}${this.getNthSelector(matchingPathEl, tag)}`);
                continue;
              }
            }
          }

          // No disambiguation needed
          parts.push(tag);
        }

        // Add target: ONLY attrs, NO classes
        const targetSelector = this.buildNodeSelector(
          eid.target.tag,
          eid.target.semantics,
          { excludeClasses: true } // KEY: no classes on target
        );
        parts.push(targetSelector);

        const selector = parts.join(' ');
        return this.isUnique(selector, root) ? selector : null;
      },

      // ============================================================
      // Strategy 3: anchor path target[attrs + 1_stable_class]
      // Add ONE stable class to target (must be semantic, NOT utility)
      // Only use this if attrs alone are not sufficient
      // ============================================================
      () => {
        const anchorSelector = this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);
        const meaningfulTags: string[] = [];

        for (const pathNode of eid.path) {
          meaningfulTags.push(pathNode.tag);
        }

        // Target with ONE stable class
        const stableClasses = filterStableClasses(eid.target.semantics.classes ?? []);

        if (stableClasses.length === 0) {
          return null; // No stable classes available
        }

        const targetSelector = this.buildNodeSelector(
          eid.target.tag,
          eid.target.semantics,
          { maxClasses: 1 } // KEY: ONE stable class only
        );

        const selector = [anchorSelector, ...meaningfulTags.slice(0, -1), targetSelector].join(' ');
        return this.isUnique(selector, root) ? selector : null;
      },

      // ============================================================
      // Strategy 4: anchor path target[attrs]:nth-of-type(N)
      // Last resort - add nth-of-type to target
      // Only use when all other strategies fail
      // ============================================================
      () => {
        const anchorSelector = this.buildNodeSelector(eid.anchor.tag, eid.anchor.semantics);
        const meaningfulTags: string[] = [];

        for (const pathNode of eid.path) {
          meaningfulTags.push(pathNode.tag);
        }

        // Target with attrs only + nth-of-type
        const targetEl = pathElements[pathElements.length - 1];
        const targetParent = targetEl.parentElement;

        if (!targetParent) return null;

        const targetSiblings = Array.from(targetParent.children).filter(
          s => s.tagName.toLowerCase() === eid.target.tag
        );

        if (targetSiblings.length <= 1) return null;

        const targetSelector = this.buildNodeSelector(
          eid.target.tag,
          eid.target.semantics,
          { excludeClasses: true } // No classes, just attrs + nth
        ) + this.getNthSelector(targetEl, eid.target.tag);

        const selector = [anchorSelector, ...meaningfulTags.slice(0, -1), targetSelector].join(' ');
        return this.isUnique(selector, root) ? selector : null;
      }
    ];

    // Try each strategy in order
    for (const strategy of strategies) {
      const selector = strategy();
      if (selector) return selector;
    }

    // Fallback to the last path generated
    return null;
  }

  /**
   * Builds a minimal selector for a DOM element
   * @param element The DOM element to create a selector for
   * @returns A minimal CSS selector for the element
   */
  // @ts-ignore: Method is used dynamically in buildPathFromAnchorToTarget
  private buildElementSelector(element: Element): string {
    const tag = element.tagName.toLowerCase();
    let selector = tag;

    // Add ID if stable
    if (element.id && !this.isDynamicId(element.id)) {
      return `${tag}#${this.escapeCSS(element.id)}`;
    }

    // Add stable classes
    const classes = Array.from(element.classList);
    const stableClasses = filterStableClasses(classes);
    if (stableClasses.length > 0) {
      selector += stableClasses.slice(0, 2).map(c => `.${this.escapeCSS(c)}`).join('');
    }

    // Add role if present
    const role = element.getAttribute('role');
    if (role) {
      selector += `[role="${this.escapeAttr(role)}"]`;
    }

    return selector;
  }

  /**
   * Checks if ID is dynamic (generated)
   */
  private isDynamicId(id: string): boolean {
    // Pattern for dynamic IDs
    const dynamicPatterns = [
      /^[a-f0-9]{8,}$/i,     // hex hash
      /^\d{5,}$/,             // numeric
      /^(r|react|ember|vue)[\d_]/i,  // framework prefixes
      /:r\d+:$/,              // React 18 ID pattern
    ];
    return dynamicPatterns.some(p => p.test(id));
  }

  /**
   * Safe querySelectorAll that doesn't throw
   */
  private querySelectorSafe(selector: string, root: Document | Element): Element[] {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  /**
   * Finds element by matching text content
   * Returns the matching element (used with getNthSelector for table-aware positioning)
   */
  private findNthElementByText(
    selector: string,
    targetSemantics: ElementSemantics,
    root: Document | Element
  ): Element | null {
    const candidates = this.querySelectorSafe(selector, root);
    if (candidates.length <= 1) return null;

    // Find by text content (most reliable for this case)
    if (targetSemantics.text) {
      const normalizedText = targetSemantics.text.normalized;

      for (const candidate of candidates) {
        const elText = candidate.textContent?.trim() || '';
        if (elText === normalizedText ||
            elText.includes(normalizedText) ||
            normalizedText.includes(elText)) {
          return candidate;  // Return element instead of index
        }
      }
    }

    return null;
  }

  /**
   * Checks if selector matches exactly one element
   */
  private isUnique(selector: string, root: Document | Element): boolean {
    try {
      const elements = root.querySelectorAll(selector);
      return elements.length === 1;
    } catch {
      return false;
    }
  }

  /**
   * Gets nth-of-type index for an element
   */
  private getNthOfTypeIndex(element: Element, tag: string): number | null {
    const parent = element.parentElement;
    if (!parent) return null;

    // Get all siblings with same tag
    const siblings = Array.from(parent.children).filter(
      (el) => el.tagName.toLowerCase() === tag
    );

    const index = siblings.indexOf(element);
    return index !== -1 ? index + 1 : null;
  }

  /**
   * FIX 2: Ensures anchor selector is unique in the document
   * Priority order: tag → tag.class → tag[attr] → tag:nth-of-type(N)
   * @param eid - Element Identity with anchor information
   * @param root - Root element for uniqueness check
   * @returns Unique selector for anchor
   */
  private ensureUniqueAnchor(
    eid: ElementIdentity,
    root: Document | Element
  ): string {
    const tag = eid.anchor.tag;
    const semantics = eid.anchor.semantics;

    // Step 1: Try just tag
    if (this.isUnique(tag, root)) {
      return tag;
    }

    // Step 2: Try tag with first stable class
    if (semantics.classes && semantics.classes.length > 0) {
      const stableClasses = filterStableClasses(semantics.classes);

      if (stableClasses.length > 0) {
        const selectorWithClass = `${tag}.${this.escapeCSS(stableClasses[0])}`;
        if (this.isUnique(selectorWithClass, root)) {
          return selectorWithClass;
        }
      }
    }

    // Step 3: Try tag with stable attribute
    if (semantics.attributes) {
      const sortedAttrs = this.getSortedAttributes(semantics.attributes);

      for (const { name, value } of sortedAttrs) {
        const cleanedValue =
          name === 'href' || name === 'src'
            ? cleanAttributeValue(name, value)
            : value;

        if (cleanedValue) {
          const selectorWithAttr = `${tag}[${name}="${this.escapeAttr(cleanedValue)}"]`;
          if (this.isUnique(selectorWithAttr, root)) {
            return selectorWithAttr;
          }
        }
      }
    }

    // Step 4: Try tag with nth-of-type
    // Find all elements with this tag in root
    const allAnchors = Array.from(root.querySelectorAll(tag));

    if (allAnchors.length > 1) {
      // Need to match by semantics to find the correct anchor
      const matchingAnchor = this.findElementBySemantics(allAnchors, semantics);

      if (matchingAnchor) {
        const nthIndex = this.getNthOfTypeIndex(matchingAnchor, tag);
        if (nthIndex) {
          return `${tag}:nth-of-type(${nthIndex})`;
        }
      }
    }

    // Fallback: just tag
    return tag;
  }

  /**
   * FIX 2: Finds element by matching semantics
   * @param elements - Array of candidate elements
   * @param semantics - Semantics to match against
   * @returns Matching element or null
   */
  private findElementBySemantics(
    elements: Element[],
    semantics: ElementSemantics
  ): Element | null {
    // If semantics is empty (no classes, attributes, or text), return first element
    const hasSemantics = 
      (semantics.classes && semantics.classes.length > 0) ||
      (semantics.attributes && Object.keys(semantics.attributes).length > 0) ||
      semantics.text;
    
    if (!hasSemantics) {
      return elements.length > 0 ? elements[0] : null;
    }

    return (
      elements.find((el) => {
        // Match by classes
        if (semantics.classes && semantics.classes.length > 0) {
          const hasClasses = semantics.classes.every((cls) =>
            el.classList.contains(cls)
          );
          if (hasClasses) return true;
        }

        // Match by attributes
        if (semantics.attributes) {
          const hasAttrs = Object.entries(semantics.attributes).every(
            ([name, value]) => el.getAttribute(name) === value
          );
          if (hasAttrs) return true;
        }

        // Match by text
        if (semantics.text) {
          const elText = el.textContent?.trim() || '';
          const normalized = semantics.text.normalized;
          if (elText.includes(normalized) || normalized.includes(elText)) {
            return true;
          }
        }

        return false;
      }) || null
    );
  }

  /**
   * FIX 3: Gets nth selector - nth-child for tables, nth-of-type for others
   * This method is now ACTIVELY INTEGRATED in selector generation logic
   * to ensure table elements use position-specific nth-child selectors
   * @param element - Element to get selector for
   * @param tag - Tag name
   * @returns nth selector string (e.g., ":nth-child(2)" or ":nth-of-type(2)")
   */
  private getNthSelector(element: Element, tag: string): string {
    const parent = element.parentElement;
    if (!parent) return '';

    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;

    // For table elements use nth-child (more reliable for table structure)
    if (['tr', 'td', 'th', 'thead', 'tbody', 'tfoot'].includes(tag)) {
      return `:nth-child(${index})`;
    }

    // For other elements use nth-of-type
    const sameTags = siblings.filter((s) => s.tagName.toLowerCase() === tag);
    const typeIndex = sameTags.indexOf(element) + 1;
    return `:nth-of-type(${typeIndex})`;
  }

  /**
   * Gets attribute priority for sorting
   * @param attrName - Attribute name
   * @returns Priority number (higher = more priority)
   */
  private getAttributePriority(attrName: string): number {
    // Exact match
    if (ATTRIBUTE_PRIORITY[attrName] !== undefined) {
      return ATTRIBUTE_PRIORITY[attrName];
    }

    // data-* wildcard
    if (attrName.startsWith('data-')) {
      return ATTRIBUTE_PRIORITY['data-*'];
    }

    // aria-* wildcard
    if (attrName.startsWith('aria-')) {
      return ATTRIBUTE_PRIORITY['aria-*'];
    }

    return 0; // Don't use in selector
  }

  /**
   * Checks if attribute should be ignored
   * @param attrName - Attribute name
   * @returns True if should be ignored
   */
  private shouldIgnoreAttribute(attrName: string): boolean {
    // Ignored attributes
    if (IGNORED_ATTRIBUTES.has(attrName)) return true;

    // Inline event handlers
    if (attrName.startsWith('on')) return true;

    // Angular/React service attributes
    if (attrName.startsWith('ng-') || attrName.startsWith('_ng')) return true;
    if (attrName.startsWith('data-reactid') || attrName.startsWith('data-react'))
      return true;
    if (attrName.startsWith('data-v-')) return true; // Vue scoped styles

    return false;
  }

  /**
   * Gets attributes sorted by priority
   * @param attributes - Attributes object
   * @returns Sorted array of attributes with priority
   */
  private getSortedAttributes(
    attributes: Record<string, string>
  ): Array<{ name: string; value: string; priority: number }> {
    return Object.entries(attributes)
      .filter(([name]) => !this.shouldIgnoreAttribute(name))
      .map(([name, value]) => ({
        name,
        value,
        priority: this.getAttributePriority(name),
      }))
      .filter((attr) => attr.priority > 0)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Builds selector for a single node
   * Priority: ID → semantic attributes → role → classes
   */
  private buildNodeSelector(
    tag: string,
    semantics: ElementSemantics,
    options?: { excludeClasses?: boolean; maxClasses?: number }
  ): string {
    let selector = tag;

    // 1. ID (highest priority - score 100)
    if (semantics.id) {
      selector += `#${this.escapeCSS(semantics.id)}`;
      return selector; // ID is unique enough, no need for more
    }

    // 2. Attributes in priority order (before classes!)
    if (semantics.attributes) {
      const sortedAttrs = this.getSortedAttributes(semantics.attributes);

      for (const { name, value } of sortedAttrs) {
        // Clean href/src from dynamic parts
        const cleanedValue =
          name === 'href' || name === 'src'
            ? cleanAttributeValue(name, value)
            : value;

        if (cleanedValue) {
          selector += `[${name}="${this.escapeAttr(cleanedValue)}"]`;
        }
      }
    }

    // 3. Role attribute (if not already in attributes)
    if (semantics.role && !semantics.attributes?.role) {
      selector += `[role="${this.escapeAttr(semantics.role)}"]`;
    }

    // 4. Stable classes - skip if excludeClasses is true
    if (!options?.excludeClasses && semantics.classes && semantics.classes.length > 0) {
      const stableClasses = filterStableClasses(semantics.classes);

      // Apply maxClasses limit if specified
      const classesToAdd = options?.maxClasses !== undefined
        ? stableClasses.slice(0, options.maxClasses)
        : stableClasses;

      selector += classesToAdd.map((c) => `.${this.escapeCSS(c)}`).join('');
    }

    return selector;
  }

  /**
   * Escapes special characters for CSS selector
   */
  private escapeCSS(str: string): string {
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  /**
   * Escapes quotes for attribute values
   */
  private escapeAttr(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  }

  /**
   * Checks if element tag is an SVG child element
   * @param tag - Element tag name
   * @returns True if element is an SVG child
   */
  private isSvgChildElement(tag: string): boolean {
    return SVG_CHILD_ELEMENTS.includes(tag as any);
  }
}
