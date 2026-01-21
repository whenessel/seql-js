import type { ElementSemantics } from './semantics';
import type { Constraint } from './constraints';

/**
 * SEQL Selector - canonical string representation of ElementIdentity
 * Similar to CSS Selector or XPath, but based on semantic features
 * @example "v1: footer > div.container > ul > li#3 > svg > rect"
 */
export type SeqlSelector = string;

/**
 * EID version string
 */
export type EIDVersion = '1.0';

/**
 * Main Element Identity Descriptor (EID) structure - describes "what" an element is
 * Following SPECIFICATION.md §14
 */
export interface ElementIdentity {
  /** EID specification version */
  version: EIDVersion;
  /** Semantic root/context for the path */
  anchor: AnchorNode;
  /** Semantic path from anchor to target's parent */
  path: PathNode[];
  /** The target element description */
  target: TargetNode;
  /** Disambiguation constraints (applied during resolution) */
  constraints: Constraint[];
  /** Fallback behavior rules */
  fallback: FallbackRules;
  /** Metadata about generation */
  meta: EIDMeta;
}

/**
 * Anchor node - the semantic root of the EID path
 * Following SPECIFICATION.md §7
 */
export interface AnchorNode {
  /** HTML tag name (lowercase) */
  tag: string;
  /** Semantic features */
  semantics: ElementSemantics;
  /** Quality score 0-1 */
  score: number;
  /** Whether this is a degraded/fallback anchor */
  degraded: boolean;
  /** Position among siblings (1-based, for nth-child CSS selector) */
  nthChild?: number;
}

/**
 * Path node - intermediate element in the path
 * Following SPECIFICATION.md §8
 */
export interface PathNode {
  /** HTML tag name (lowercase) */
  tag: string;
  /** Semantic features */
  semantics: ElementSemantics;
  /** Quality score 0-1 */
  score: number;
  /** Position among siblings (1-based, for nth-child CSS selector) */
  nthChild?: number;
}

/**
 * Target node - the element being identified
 */
export interface TargetNode extends PathNode {
  // Same structure as PathNode but semantically represents the target
}

/**
 * EID metadata
 */
export interface EIDMeta {
  /** Overall confidence score 0-1 */
  confidence: number;
  /** ISO timestamp when generated */
  generatedAt: string;
  /** Generator identifier */
  generator: string;
  /** Source context (e.g., 'rrweb-recorder') */
  source: string;
  /** Whether EID is degraded quality */
  degraded: boolean;
  /** Reason for degradation if degraded */
  degradationReason?: string;
}

/**
 * Fallback rules for resolution
 * Following SPECIFICATION.md §13.5
 */
export interface FallbackRules {
  /** Behavior when multiple elements match */
  onMultiple: 'allow-multiple' | 'best-score' | 'first';
  /** Behavior when target is not found */
  onMissing: 'anchor-only' | 'strict' | 'none';
  /** Maximum depth for fallback search */
  maxDepth: number;
}
