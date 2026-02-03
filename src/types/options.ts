import type { EIDCache } from '../utils/eid-cache';

/**
 * Generator options
 * Following SPECIFICATION.md §7-8
 */
export interface GeneratorOptions {
  /** Maximum path depth (default: 10) */
  maxPathDepth?: number;
  /** Enable SVG fingerprinting (default: true) */
  enableSvgFingerprint?: boolean;
  /** Minimum confidence to return EID (default: 0.0) */
  confidenceThreshold?: number;
  /** Fallback to body if no anchor found (default: true) */
  fallbackToBody?: boolean;
  /** Include utility classes in EID (default: false) */
  includeUtilityClasses?: boolean;
  /** Source identifier for metadata */
  source?: string;
  /** Optional cache instance for performance optimization */
  cache?: EIDCache;
  /**
   * Root element or document for validation (optional).
   *
   * ⚠️ IMPORTANT: When working with iframes, pass iframe.contentDocument
   * to ensure cross-document validation works correctly.
   *
   * @example
   * // Main document
   * generateEID(element, { root: document });
   *
   * // Iframe content
   * const iframe = document.querySelector('iframe');
   * generateEID(iframeElement, { root: iframe.contentDocument });
   */
  root?: Document | Element;
}

/**
 * Resolver options
 * Following SPECIFICATION.md §13
 */
export interface ResolverOptions {
  /** Strict mode: fail on ambiguity (default: false) */
  strictMode?: boolean;
  /** Enable fallback mechanisms (default: true) */
  enableFallback?: boolean;
  /** Maximum candidates to consider (default: 20) */
  maxCandidates?: number;
  /**
   * Root element or document for CSS queries.
   *
   * ⚠️ IMPORTANT: When working with iframes, you MUST pass iframe.contentDocument
   * as the root parameter. Otherwise, resolution will fail or return incorrect elements.
   *
   * @example
   * // Main document
   * resolve(eid, document, { root: document });
   *
   * // Iframe content
   * const iframe = document.querySelector('iframe');
   * resolve(eid, iframe.contentDocument, { root: iframe.contentDocument });
   */
  root?: Document | Element;
  /**
   * Document base URL for URL normalization.
   * Used when comparing href/src attributes to provide correct origin context.
   *
   * ⚠️ IMPORTANT: When working with iframes, this should match iframe.contentWindow.location.href
   * to ensure correct same-origin detection.
   *
   * If not provided, falls back to root.defaultView?.location?.href or window.location.href.
   *
   * @example
   * // Iframe context
   * const iframe = document.querySelector('iframe');
   * resolve(eid, iframe.contentDocument, {
   *   root: iframe.contentDocument,
   *   documentUrl: iframe.contentWindow.location.href
   * });
   *
   * @example
   * // Manual override for testing
   * resolve(eid, document, {
   *   documentUrl: 'https://example.com'
   * });
   */
  documentUrl?: string;
  /**
   * Match URLs by pathname only, ignoring origin differences.
   * Useful for cross-origin rrweb replay scenarios (e.g., localhost dev with production links).
   *
   * When enabled (default):
   * - /booking matches https://any-origin.com/booking
   * - Ignores protocol and domain differences
   * - Compares only pathname (+ search + hash if present)
   * - Recommended for rrweb replay and development environments
   *
   * When disabled:
   * - Full URL normalization with same-origin detection
   * - Cross-origin URLs preserved as absolute
   * - More strict origin validation
   *
   * @default true
   */
  matchUrlsByPathOnly?: boolean;
}
