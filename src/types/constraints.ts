/**
 * Constraint type identifiers
 * Following SPECIFICATION.md §13.4
 */
export type ConstraintType =
  | 'uniqueness'
  | 'text-proximity'
  | 'position';

/**
 * Base constraint structure
 */
export interface Constraint {
  /** Constraint type */
  type: ConstraintType;
  /** Constraint-specific parameters */
  params: Record<string, unknown>;
  /** Priority (0-100, higher = applied first) */
  priority: number;
}

/**
 * Uniqueness constraint
 */
export interface UniquenessConstraint extends Constraint {
  type: 'uniqueness';
  params: {
    mode: 'strict' | 'best-score' | 'allow-multiple';
  };
}


/**
 * Text proximity constraint (Levenshtein distance)
 */
export interface TextProximityConstraint extends Constraint {
  type: 'text-proximity';
  params: {
    reference: string;
    maxDistance: number;
  };
}

/**
 * Position constraint (degraded fallback)
 */
export interface PositionConstraint extends Constraint {
  type: 'position';
  params: {
    strategy: 'top-most' | 'left-most' | 'first-in-dom';
  };
}
