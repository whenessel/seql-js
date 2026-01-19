/**
 * Constraint type identifiers
 * Following SPECIFICATION.md §13.4
 */
export type ConstraintType =
  | 'uniqueness'
  | 'visibility'
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
 * Visibility constraint
 */
export interface VisibilityConstraint extends Constraint {
  type: 'visibility';
  params: {
    required: boolean;
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
