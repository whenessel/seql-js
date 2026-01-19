/**
 * seql-js
 *
 * Semantic Element Query Language - Stable DOM element identification
 * Element Identity Descriptors (EID) for web analytics and session replay
 *
 * @packageDocumentation
 */

// ============================================================================
// Types
// ============================================================================

// Core EID types
export type {
  EIDVersion,
  ElementIdentity,
  AnchorNode,
  PathNode,
  TargetNode,
  EIDMeta,
  FallbackRules,
  SeqlSelector,
} from './types';

// Semantic types
export type { ElementSemantics, TextContent, SvgFingerprint } from './types';

// Constraint types
export type {
  ConstraintType,
  Constraint,
  UniquenessConstraint,
  TextProximityConstraint,
  PositionConstraint,
} from './types';

// Options types
export type { GeneratorOptions, ResolverOptions } from './types';

// Result types
export type { ResolveStatus, ResolveResult, ValidationResult } from './types';

// ============================================================================
// Generator
// ============================================================================

// Main generator function
export { generateEID } from './generator';

// Generator components (for advanced usage)
export {
  AnchorFinder,
  PathBuilder,
  SemanticExtractor,
  SvgFingerprinter,
} from './generator';
export type { AnchorResult } from './generator';

// ============================================================================
// Resolver
// ============================================================================

// Main resolver function
export { resolve } from './resolver';

// Resolver components (for advanced usage)
export {
  CssGenerator,
  SemanticsMatcher,
  ConstraintsEvaluator,
  FallbackHandler,
} from './resolver';

// ============================================================================
// Utilities
// ============================================================================

// Validation
export { validateEID, isEID } from './utils';

// SEQL Selector Parser
export { parseSEQL, stringifySEQL, generateSEQL, resolveSEQL } from './utils';

// Text processing
export { normalizeText } from './utils';

// Class filtering
export { filterClasses, isUtilityClass, getClassScore } from './utils';

// Scoring
export { calculateConfidence, calculateElementScore } from './utils';

// Constants
export {
  EID_VERSION,
  MAX_PATH_DEPTH,
  SEMANTIC_ANCHOR_TAGS,
  SEMANTIC_TAGS,
  SEMANTIC_ATTRIBUTES,
  ROLE_ANCHOR_VALUES,
  DEFAULT_GENERATOR_OPTIONS,
  DEFAULT_RESOLVER_OPTIONS,
} from './utils';

// Cache
export {
  EIDCache,
  createEIDCache,
  getGlobalCache,
  resetGlobalCache,
  type CacheStats,
  type EIDCacheOptions,
} from './utils';

// Batch generation
export {
  generateEIDBatch,
  generateEIDForElements,
  type BatchGeneratorOptions,
  type BatchResult,
} from './utils';
