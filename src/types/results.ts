/**
 * Resolution status
 * Following SPECIFICATION.md §13.5
 */
export type ResolveStatus =
  | 'success'
  | 'ambiguous'
  | 'error'
  | 'degraded-fallback';

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
    degradationReason?: string;
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
