/**
 * Resolution status
 * Following SPECIFICATION.md §13.5
 */
export type ResolveStatus = 'success' | 'ambiguous' | 'error' | 'degraded-fallback';

/**
 * Resolve result
 */
export interface ResolveResult {
  /** Resolution status */
  status: ResolveStatus;
  /** Matched elements (0, 1, or multiple) */
  elements: Element[];
  /** Warning messages */
  warnings: string[];
  /** Confidence score of match */
  confidence: number;
  /** Metadata about resolution */
  meta: {
    degraded: boolean;
    degradationReason?:
      | 'not-found'
      | 'strict-not-found'
      | 'ambiguous'
      | 'anchor-fallback'
      | 'anchor-not-found'
      | 'first-of-multiple'
      | 'best-of-multiple'
      | 'multiple-matches'
      | 'over-constrained'
      | 'relaxed-text-matching'
      | 'invalid-context'
      | 'invalid-selector'
      | 'invalid-anchor-selector';
  };
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether DSL is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}
