import type { ElementIdentity, GeneratorOptions, Constraint, FallbackRules } from '../types';
import { AnchorFinder } from './anchor-finder';
import { PathBuilder } from './path-builder';
import { SemanticExtractor } from './semantic-extractor';
import { SvgFingerprinter } from './svg-fingerprinter';
import { calculateConfidence } from '../utils/scorer';
import { EID_VERSION, DEFAULT_GENERATOR_OPTIONS, ANCHOR_SCORE } from '../utils/constants';
import { getGlobalCache } from '../utils/eid-cache';
import { validateDocumentContext } from '../utils/document-context';

/**
 * Generates EID (Element Identity) for a DOM element
 * Following SPECIFICATION.md §7-11
 *
 * @param target - Target DOM element
 * @param options - Generation options
 * @returns Element identity or null if generation failed
 */
export function generateEID(
  target: Element,
  options: GeneratorOptions = {}
): ElementIdentity | null {
  // Input validation
  if (!target || !target.ownerDocument) {
    return null;
  }

  // Ensure target is part of a document
  if (!target.isConnected) {
    return null;
  }

  const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };

  // Validate document context if root is provided (iframe safety)
  if (opts.root) {
    try {
      validateDocumentContext(target, opts.root);
    } catch (error) {
      console.error('Cross-document generation detected:', error);
      return null;
    }
  }

  // Get cache instance (use provided or global default)
  const cache = opts.cache ?? getGlobalCache();

  // Check cache for complete EID first
  const cachedEID = cache.getEID(target);
  if (cachedEID !== undefined) {
    return cachedEID;
  }

  const targetTag = target.tagName.toLowerCase();

  // Fast-path for <html> element
  if (targetTag === 'html') {
    const semanticExtractor = new SemanticExtractor(opts, cache);
    const htmlEID = generateHtmlEID(target, opts, semanticExtractor, cache);
    cache.setEID(target, htmlEID);
    return htmlEID;
  }

  const anchorFinder = new AnchorFinder(opts, cache);
  const pathBuilder = new PathBuilder(opts, cache);
  const semanticExtractor = new SemanticExtractor(opts, cache);
  const svgFingerprinter = new SvgFingerprinter();

  // 1. Find anchor
  const anchorResult = anchorFinder.findAnchor(target);
  if (!anchorResult && !opts.fallbackToBody) {
    return null;
  }

  // Use found anchor or fallback to body
  const anchorElement = anchorResult?.element ?? target.ownerDocument?.body ?? null;
  if (!anchorElement) return null;

  // Determine if anchor is degraded
  const anchorDegraded = !anchorResult || anchorResult.tier === 'C';

  // Calculate nth-child position for anchor (same logic as for target)
  // Skip for body/html elements as they are unique by definition
  const anchorTag = anchorElement.tagName.toLowerCase();
  const anchorParent = anchorElement.parentElement;
  let anchorNthChild: number | undefined;
  if (anchorParent && anchorTag !== 'body' && anchorTag !== 'html') {
    const siblings = Array.from(anchorParent.children);
    const index = siblings.indexOf(anchorElement);
    if (index !== -1) {
      anchorNthChild = index + 1; // 1-based for CSS nth-child()
    }
  }

  // 2. Build anchor node
  const anchorSemantics = semanticExtractor.extract(anchorElement);
  const anchorNode = {
    tag: anchorElement.tagName.toLowerCase(),
    semantics: anchorSemantics,
    score: anchorResult?.score ?? ANCHOR_SCORE.DEGRADED_SCORE,
    degraded: anchorDegraded,
    nthChild: anchorNthChild,
  };

  // 3. Build path (now returns PathBuildResult with degradation info)
  const pathResult = pathBuilder.buildPath(anchorElement, target, semanticExtractor);

  // 4. Build target node
  const targetSemantics = semanticExtractor.extract(target);

  // Add SVG fingerprint if applicable
  if (opts.enableSvgFingerprint && isSvgElement(target)) {
    targetSemantics.svg = svgFingerprinter.fingerprint(target as SVGElement);
  }

  // Calculate nth-child position for target (same logic as in PathBuilder)
  const targetParent = target.parentElement;
  let targetNthChild: number | undefined;
  if (targetParent) {
    const siblings = Array.from(targetParent.children);
    const index = siblings.indexOf(target);
    if (index !== -1) {
      targetNthChild = index + 1; // 1-based for CSS nth-child()
    }
  }

  const targetNode = {
    tag: target.tagName.toLowerCase(),
    semantics: targetSemantics,
    score: semanticExtractor.scoreElement(target),
    nthChild: targetNthChild,
  };

  // 5. Build constraints
  const constraints: Constraint[] = [];

  // 6. Build fallback rules
  const fallback: FallbackRules = {
    onMultiple: 'best-score',
    onMissing: 'anchor-only',
    maxDepth: 3,
  };

  // Determine overall degradation status
  const isDegraded = anchorNode.degraded || pathResult.degraded;
  const degradationReason = getDegradationReason(anchorNode.degraded, pathResult);

  // 7. Build EID
  const eid: ElementIdentity = {
    version: EID_VERSION,
    anchor: anchorNode,
    path: pathResult.path,
    target: targetNode,
    constraints,
    fallback,
    meta: {
      confidence: 0, // Calculated below
      generatedAt: new Date().toISOString(),
      generator: `dom-eid@${EID_VERSION}`,
      source: opts.source,
      degraded: isDegraded,
      degradationReason,
    },
  };

  // 8. Calculate confidence
  eid.meta.confidence = calculateConfidence(eid);

  // 9. Check threshold
  if (eid.meta.confidence < opts.confidenceThreshold) {
    return null;
  }

  // Cache the result
  cache.setEID(target, eid);

  return eid;
}

/**
 * Checks if element is an SVG element
 */
function isSvgElement(el: Element): boolean {
  return (
    el.namespaceURI === 'http://www.w3.org/2000/svg' ||
    el.tagName.toLowerCase() === 'svg' ||
    el instanceof SVGElement
  );
}

/**
 * Determines the degradation reason based on various factors
 */
function getDegradationReason(
  anchorDegraded: boolean,
  pathResult: { degraded: boolean; degradationReason?: string }
): string | undefined {
  if (anchorDegraded && pathResult.degraded) {
    return 'anchor-and-path-degraded';
  }
  if (anchorDegraded) {
    return 'no-semantic-anchor';
  }
  if (pathResult.degraded) {
    return pathResult.degradationReason;
  }
  return undefined;
}

/**
 * Generates EID for <html> element (special case).
 * The html element is unique by definition, so anchor = target = html.
 * @param htmlElement - The html DOM element
 * @param options - Generation options
 * @param extractor - Semantic extractor instance
 * @param cache - EID cache instance
 * @returns Element identity for html element
 * @remarks
 * This is a fast-path that bypasses normal anchor finding.
 * The html element is the root of the document and serves as its own anchor.
 * Confidence is always 1.0 and degraded is always false.
 * @example
 * const html = document.documentElement;
 * const eid = generateHtmlEID(html, options, extractor, cache);
 * // Returns EID with anchor = target = html, path = []
 */
function generateHtmlEID(
  htmlElement: Element,
  opts: Required<Omit<GeneratorOptions, 'cache' | 'root'>> &
    Pick<GeneratorOptions, 'cache' | 'root'>,
  extractor: SemanticExtractor,
  cache: ReturnType<typeof getGlobalCache>
): ElementIdentity {
  const htmlSemantics = extractor.extract(htmlElement);

  // Html element has no parent, so no nth-child
  const htmlNode = {
    tag: 'html',
    semantics: htmlSemantics,
    score: 1.0,
    degraded: false,
    nthChild: undefined,
  };

  const constraints: Constraint[] = [];

  const fallback: FallbackRules = {
    onMultiple: 'best-score',
    onMissing: 'anchor-only',
    maxDepth: 3,
  };

  const eid: ElementIdentity = {
    version: EID_VERSION,
    anchor: htmlNode,
    path: [],
    target: htmlNode,
    constraints,
    fallback,
    meta: {
      confidence: 1.0,
      generatedAt: new Date().toISOString(),
      generator: `dom-eid@${EID_VERSION}`,
      source: opts.source,
      degraded: false,
      degradationReason: undefined,
    },
  };

  return eid;
}
