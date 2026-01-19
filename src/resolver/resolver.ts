import type { ElementIdentity, ResolveResult, ResolverOptions } from '../types';
import { CssGenerator, type BuildSelectorResult } from './css-generator';
import { SemanticsMatcher } from './semantics-matcher';
import { ConstraintsEvaluator } from './constraints-evaluator';
import { FallbackHandler } from './fallback-handler';
import { DEFAULT_RESOLVER_OPTIONS } from '../utils/constants';

/**
 * Resolves Element Identity back to DOM element(s)
 * Following SPECIFICATION.md §13 (5-phase algorithm)
 *
 * @param eid - Element Identity to resolve
 * @param dom - Document or root element to search in
 * @param options - Resolver options
 * @returns Resolution result with matched elements
 */
export function resolve(
  eid: ElementIdentity,
  dom: Document | Element,
  options: ResolverOptions = {},
): ResolveResult {
  const opts = { ...DEFAULT_RESOLVER_OPTIONS, ...options };

  const cssGenerator = new CssGenerator();
  const semanticsMatcher = new SemanticsMatcher();
  const constraintsEvaluator = new ConstraintsEvaluator();
  const fallbackHandler = new FallbackHandler();

  // Phase 1: CSS Narrowing
  // Use ensureUnique to generate more specific selectors
  const root = dom instanceof Document ? dom : (dom.ownerDocument ?? dom);
  const selectorResult = cssGenerator.buildSelector(eid, {
    ensureUnique: true,
    root,
  });
  // When ensureUnique is true, buildSelector returns BuildSelectorResult
  const selector = (selectorResult as unknown as BuildSelectorResult).selector;

  let candidates: Element[];
  try {
    candidates = Array.from(root.querySelectorAll(selector));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown selector error';
    return {
      status: 'error',
      elements: [],
      warnings: [
        `Invalid CSS selector: ${selector}`,
        `Error: ${errorMessage}`,
      ],
      confidence: 0,
      meta: { degraded: true, degradationReason: 'invalid-selector' },
    };
  }

  // Limit candidates for performance
  if (candidates.length > opts.maxCandidates) {
    candidates = candidates.slice(0, opts.maxCandidates);
  }

  // Phase 2: Semantics Filtering
  const filtered = semanticsMatcher.match(candidates, eid.target.semantics);

  // Phase 3: Uniqueness Check
  if (filtered.length === 1) {
    return {
      status: 'success',
      elements: filtered,
      warnings: [],
      confidence: eid.meta.confidence,
      meta: { degraded: false },
    };
  }

  // No matches found
  if (filtered.length === 0) {
    if (opts.enableFallback) {
      return fallbackHandler.handleFallback(eid, root);
    }
    return {
      status: 'error',
      elements: [],
      warnings: ['No matching elements found'],
      confidence: 0,
      meta: { degraded: true, degradationReason: 'not-found' },
    };
  }

  // Phase 4: Constraints Application
  let constrained = filtered;
  const sortedConstraints = sortByPriority(eid.constraints);

  for (const constraint of sortedConstraints) {
    constrained = constraintsEvaluator.applyConstraint(constrained, constraint);

    // Found unique match
    if (constrained.length === 1) {
      return {
        status: 'success',
        elements: constrained,
        warnings: [],
        confidence: eid.meta.confidence * 0.9,
        meta: { degraded: false },
      };
    }

    // All candidates eliminated
    if (constrained.length === 0) {
      if (opts.enableFallback) {
        return fallbackHandler.handleFallback(eid, root);
      }
      return {
        status: 'error',
        elements: [],
        warnings: ['Constraints eliminated all candidates'],
        confidence: 0,
        meta: { degraded: true, degradationReason: 'over-constrained' },
      };
    }
  }

  // Phase 5: Handle Ambiguous Result
  if (opts.strictMode) {
    return {
      status: 'ambiguous',
      elements: constrained,
      warnings: [`Non-unique resolution: ${constrained.length} matches`],
      confidence: eid.meta.confidence * 0.7,
      meta: { degraded: true, degradationReason: 'ambiguous' },
    };
  }

  // Apply fallback rules for multiple matches
  return fallbackHandler.handleAmbiguous(constrained, eid);
}

/**
 * Sorts constraints by priority (descending)
 */
function sortByPriority(
  constraints: ElementIdentity['constraints'],
): ElementIdentity['constraints'] {
  return [...constraints].sort((a, b) => b.priority - a.priority);
}
