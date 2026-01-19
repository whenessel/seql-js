// Core EID types
export type {
  EIDVersion,
  ElementIdentity,
  AnchorNode,
  PathNode,
  TargetNode,
  EIDMeta,
  FallbackRules,
} from './eid';

// Semantic types
export type {
  ElementSemantics,
  TextContent,
  SvgFingerprint,
} from './semantics';

// Constraint types
export type {
  ConstraintType,
  Constraint,
  UniquenessConstraint,
  VisibilityConstraint,
  TextProximityConstraint,
  PositionConstraint,
} from './constraints';

// Options types
export type { GeneratorOptions, ResolverOptions } from './options';

// Result types
export type { ResolveStatus, ResolveResult, ValidationResult } from './results';
