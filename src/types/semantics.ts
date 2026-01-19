/**
 * Semantic features for an EID node
 * Following SPECIFICATION.md §10
 */
export interface ElementSemantics {
  /** Stable ID (not dynamic) */
  id?: string;
  /** Semantic class names (utility classes filtered out) */
  classes?: string[];
  /** Relevant attributes (aria-*, name, type, role, etc.) */
  attributes?: Record<string, string>;
  /** Text content */
  text?: TextContent;
  /** SVG fingerprint (for SVG elements) */
  svg?: SvgFingerprint;
  /** ARIA role */
  role?: string;
}

/**
 * Text content with normalization
 * Following SPECIFICATION.md §11
 */
export interface TextContent {
  /** Original text (for debugging) */
  raw: string;
  /** Normalized text (trimmed, collapsed whitespace) */
  normalized: string;
  /** Matching mode for text comparison */
  matchMode?: 'exact' | 'partial';
}

/**
 * SVG element fingerprint for stable identification
 * Following SPECIFICATION.md §9
 */
export interface SvgFingerprint {
  /** SVG shape type */
  shape:
    | 'path'
    | 'circle'
    | 'rect'
    | 'line'
    | 'polyline'
    | 'polygon'
    | 'ellipse'
    | 'g'
    | 'text'
    | 'use'
    | 'svg';
  /** Hash of path data (first N commands) for <path> elements */
  dHash?: string;
  /** Geometry hash for non-path shapes */
  geomHash?: string;
  /** Whether element has animations */
  hasAnimation: boolean;
  /** ARIA role if present */
  role?: string;
  /** <title> text inside SVG */
  titleText?: string;
}
