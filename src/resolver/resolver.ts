import type { ElementIdentity, ResolveResult, ResolverOptions } from '../types';
import { CssGenerator } from './css-generator';
import { SemanticsMatcher } from './semantics-matcher';
import { ConstraintsEvaluator } from './constraints-evaluator';
import { FallbackHandler } from './fallback-handler';
import { DEFAULT_RESOLVER_OPTIONS } from '../utils/constants';
import { getOwnerDocument } from '../utils/document-context';

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
  options: ResolverOptions = {}
): ResolveResult {
  const opts = { ...DEFAULT_RESOLVER_OPTIONS, ...options };

  // Validate document context early - catch detached elements and cross-document issues
  let root: Document;
  try {
    if (dom instanceof Document) {
      root = dom;
    } else {
      root = getOwnerDocument(dom);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'error',
      elements: [],
      warnings: ['Failed to resolve document context', errorMessage],
      confidence: 0,
      meta: { degraded: true, degradationReason: 'invalid-context' },
    };
  }

  // Validate options.root consistency if provided
  if (opts.root) {
    const optionsRoot = opts.root instanceof Document ? opts.root : opts.root.ownerDocument;
    if (optionsRoot && optionsRoot !== root) {
      console.warn(
        'options.root does not match dom parameter document. ' +
          'Using document from dom parameter. ' +
          'This may indicate a cross-document operation issue.'
      );
    }
  }

  const cssGenerator = new CssGenerator();
  const semanticsMatcher = new SemanticsMatcher();
  const constraintsEvaluator = new ConstraintsEvaluator();
  const fallbackHandler = new FallbackHandler();

  // Phase 1: CSS Narrowing
  // Build a base selector. We don't use ensureUnique: true here because
  // we want to gather all potential candidates and prioritize them in later phases
  // (e.g., prioritization by visibility).
  // Use the validated root document for querying
  const selector = cssGenerator.buildSelector(eid, {
    ensureUnique: false,
    root,
  });

  let candidates: Element[];
  try {
    candidates = Array.from(root.querySelectorAll(selector));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown selector error';
    return {
      status: 'error',
      elements: [],
      warnings: [`Invalid CSS selector: ${selector}`, `Error: ${errorMessage}`],
      confidence: 0,
      meta: { degraded: true, degradationReason: 'invalid-selector' },
    };
  }

  // Store count for diagnostics
  const cssCandidateCount = candidates.length;

  // Limit candidates for performance
  if (candidates.length > opts.maxCandidates) {
    candidates = candidates.slice(0, opts.maxCandidates);
  }

  // Phase 2: Semantics Filtering
  const filtered = semanticsMatcher.match(candidates, eid.target.semantics);

  // Check if we should try lenient matching before falling back to anchor
  const shouldTryLenient =
    filtered.length === 0 && cssCandidateCount > 0 && eid.target.semantics.text !== undefined;

  if (shouldTryLenient) {
    // CSS found candidates but exact semantic matching rejected them
    // Try lenient text matching before falling back to anchor
    const lenientFiltered = semanticsMatcher.matchLenient(candidates, eid.target.semantics);

    if (lenientFiltered.length > 0) {
      // Found matches with relaxed text matching
      if (lenientFiltered.length === 1) {
        return {
          status: 'success',
          elements: lenientFiltered,
          warnings: ['Used relaxed text matching due to exact match failure'],
          confidence: eid.meta.confidence * 0.8, // Slight confidence penalty
          meta: { degraded: true, degradationReason: 'relaxed-text-matching' },
        };
      }

      // Multiple matches with lenient - continue to Phase 4 with these
      // Apply constraints and handle ambiguous result
      const constrained = applyConstraintsAndHandleAmbiguous(
        lenientFiltered,
        eid,
        constraintsEvaluator,
        fallbackHandler,
        root,
        opts,
        1.0 // No penalty here - lenient penalty applied to final result
      );

      if (constrained.elements.length > 0) {
        return {
          ...constrained,
          warnings: [...constrained.warnings, 'Used relaxed text matching'],
          confidence: constrained.confidence * 0.8, // Apply lenient matching penalty (20% degradation)
        };
      }
    }
  }

  // Phase 3: Uniqueness Check (only if not using lenient path)
  if (filtered.length === 1) {
    return {
      status: 'success',
      elements: filtered,
      warnings: [],
      confidence: eid.meta.confidence,
      meta: { degraded: false },
    };
  }

  // No matches found - add diagnostic information
  if (filtered.length === 0) {
    const diagnosticInfo =
      cssCandidateCount > 0
        ? `CSS selector found ${cssCandidateCount} candidates but semantic filtering rejected all. This may indicate text content mismatch.`
        : 'CSS selector found no candidates';

    if (opts.enableFallback) {
      const fallbackResult = fallbackHandler.handleFallback(eid, root);
      return {
        ...fallbackResult,
        warnings: [...fallbackResult.warnings, diagnosticInfo],
      };
    }

    return {
      status: 'error',
      elements: [],
      warnings: ['No matching elements found', diagnosticInfo],
      confidence: 0,
      meta: { degraded: true, degradationReason: 'not-found' },
    };
  }

  // Phase 4 & 5: Constraints Application and Handle Ambiguous Result
  return applyConstraintsAndHandleAmbiguous(
    filtered,
    eid,
    constraintsEvaluator,
    fallbackHandler,
    root,
    opts,
    1.0 // no confidence penalty for exact match path
  );
}

/**
 * Sorts constraints by priority (descending)
 */
function sortByPriority(
  constraints: ElementIdentity['constraints']
): ElementIdentity['constraints'] {
  return [...constraints].sort((a, b) => b.priority - a.priority);
}

/**
 * Apply constraints and handle ambiguous results
 * Extracted as a helper to reuse for both exact and lenient matching paths
 */
function applyConstraintsAndHandleAmbiguous(
  candidates: Element[],
  eid: ElementIdentity,
  constraintsEvaluator: ConstraintsEvaluator,
  fallbackHandler: FallbackHandler,
  root: Document,
  opts: {
    strictMode: boolean;
    enableFallback: boolean;
    maxCandidates: number;
    root?: Document | Element;
  },
  confidenceMultiplier: number
): ResolveResult {
  // Phase 4: Constraints Application
  let constrained = candidates;
  const sortedConstraints = sortByPriority(eid.constraints);

  for (const constraint of sortedConstraints) {
    constrained = constraintsEvaluator.applyConstraint(constrained, constraint);

    // Found unique match
    if (constrained.length === 1) {
      return {
        status: 'success',
        elements: constrained,
        warnings: [],
        confidence: eid.meta.confidence * 0.9 * confidenceMultiplier,
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
      confidence: eid.meta.confidence * 0.7 * confidenceMultiplier,
      meta: { degraded: true, degradationReason: 'ambiguous' },
    };
  }

  // Apply fallback rules for multiple matches
  const result = fallbackHandler.handleAmbiguous(constrained, eid);
  return {
    ...result,
    confidence: result.confidence * confidenceMultiplier,
  };
}
