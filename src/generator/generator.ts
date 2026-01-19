import type {
  ElementIdentity,
  GeneratorOptions,
  Constraint,
  FallbackRules,
} from '../types';
import { AnchorFinder } from './anchor-finder';
import { PathBuilder } from './path-builder';
import { SemanticExtractor } from './semantic-extractor';
import { SvgFingerprinter } from './svg-fingerprinter';
import { calculateConfidence } from '../utils/scorer';
import { EID_VERSION, DEFAULT_GENERATOR_OPTIONS, ANCHOR_SCORE } from '../utils/constants';
import { getGlobalCache } from '../utils/eid-cache';

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
  options: GeneratorOptions = {},
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

  // Get cache instance (use provided or global default)
  const cache = opts.cache ?? getGlobalCache();

  // Check cache for complete EID first
  const cachedEID = cache.getEID(target);
  if (cachedEID !== undefined) {
    return cachedEID;
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
  const anchorElement =
    anchorResult?.element ?? target.ownerDocument?.body ?? null;
  if (!anchorElement) return null;

  // Determine if anchor is degraded
  const anchorDegraded = !anchorResult || anchorResult.tier === 'C';

  // 2. Build anchor node
  const anchorSemantics = semanticExtractor.extract(anchorElement);
  const anchorNode = {
    tag: anchorElement.tagName.toLowerCase(),
    semantics: anchorSemantics,
    score: anchorResult?.score ?? ANCHOR_SCORE.DEGRADED_SCORE,
    degraded: anchorDegraded,
  };

  // 3. Build path (now returns PathBuildResult with degradation info)
  const pathResult = pathBuilder.buildPath(
    anchorElement,
    target,
    semanticExtractor,
  );

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
  const constraints = buildDefaultConstraints();

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
  pathResult: { degraded: boolean; degradationReason?: string },
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
 * Builds default constraints for resolution
 */
function buildDefaultConstraints(): Constraint[] {
  return [
    {
      type: 'uniqueness',
      params: { mode: 'best-score' },
      priority: 100,
    },
    {
      type: 'visibility',
      params: { required: true },
      priority: 80,
    },
  ];
}
