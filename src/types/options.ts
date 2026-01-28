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
}
