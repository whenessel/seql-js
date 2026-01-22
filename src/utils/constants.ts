import type { EIDVersion, GeneratorOptions, ResolverOptions } from '../types';

/**
 * EID specification version
 */
export const EID_VERSION: EIDVersion = '1.0';

/**
 * Maximum path depth for traversal
 * Following SPECIFICATION.md §8
 */
export const MAX_PATH_DEPTH = 10;

/**
 * Confidence calculation weights
 * Following SPECIFICATION.md §13
 */
export const CONFIDENCE_WEIGHTS = {
  ANCHOR: 0.4,
  PATH: 0.3,
  TARGET: 0.2,
  UNIQUENESS: 0.1,
} as const;

/**
 * Anchor scoring weights
 * Following SPECIFICATION.md §7
 */
export const ANCHOR_SCORE = {
  SEMANTIC_TAG: 0.5,
  ROLE: 0.3,
  ARIA_LABEL: 0.1,
  STABLE_ID: 0.1,
  TEST_MARKER: 0.05,
  DEPTH_PENALTY_THRESHOLD: 5,
  DEPTH_PENALTY_FACTOR: 0.05,
  DEGRADED_SCORE: 0.3,
} as const;

/**
 * Path building constants
 */
export const PATH_SCORE = {
  MIN_CONFIDENCE_FOR_SKIP: 0.7,
} as const;

/**
 * Tier A semantic anchor tags - highest priority
 * Following SPECIFICATION.md §7
 */
export const SEMANTIC_ANCHOR_TAGS = [
  'form',
  'main',
  'nav',
  'section',
  'article',
  'footer',
  'header',
];

/**
 * Tier B role values for anchor detection
 * Following SPECIFICATION.md §7
 */
export const ROLE_ANCHOR_VALUES = [
  'form',
  'navigation',
  'main',
  'region',
  'contentinfo',
  'complementary',
  'banner',
  'search',
];

/**
 * All semantic tags to include in path
 * Following SPECIFICATION.md §8
 */
export const SEMANTIC_TAGS = [
  // HTML5 Semantic
  'article',
  'aside',
  'details',
  'figcaption',
  'figure',
  'footer',
  'header',
  'main',
  'mark',
  'nav',
  'section',
  'summary',
  'time',
  // Form elements
  'button',
  'datalist',
  'fieldset',
  'form',
  'input',
  'label',
  'legend',
  'meter',
  'optgroup',
  'option',
  'output',
  'progress',
  'select',
  'textarea',
  // Interactive
  'a',
  'audio',
  'video',
  'canvas',
  'dialog',
  'menu',
  // Text content
  'blockquote',
  'dd',
  'dl',
  'dt',
  'hr',
  'li',
  'ol',
  'ul',
  'p',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Table
  'caption',
  'col',
  'colgroup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  // SVG
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'g',
  'text',
  'use',
];

/**
 * SVG child elements that are direct children of svg element
 * These require child combinator for accurate selection
 */
export const SVG_CHILD_ELEMENTS = [
  'rect',
  'path',
  'circle',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'g',
  'text',
  'use',
  'defs',
  'clipPath',
  'mask',
] as const;

/**
 * Semantic attributes to extract
 */
export const SEMANTIC_ATTRIBUTES = [
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'name',
  'type',
  'data-testid',
  'data-qa',
  'data-test',
  'href',
  'title',
  'placeholder',
  'alt',
];

/**
 * Attribute priorities for CSS selector generation (higher = more priority)
 * Following the priority order for selector building
 */
export const ATTRIBUTE_PRIORITY: Record<string, number> = {
  // Test attributes (highest priority)
  'data-testid': 100,
  'data-qa': 99,
  'data-cy': 98,
  'data-test': 97,
  'data-test-id': 96,

  // ARIA (accessibility semantics)
  'aria-label': 90,
  'aria-labelledby': 85,
  'aria-describedby': 80,

  // Semantic HTML attributes
  name: 75,
  href: 70, // for <a>
  src: 70, // for <img>, <script>, etc.
  type: 65,
  role: 60,
  alt: 55,
  title: 50,
  for: 45,
  placeholder: 40,

  // Any data-* attribute (if not above)
  'data-*': 30,

  // Any aria-* attribute (if not above)
  'aria-*': 25,
};

/**
 * Attributes to ignore in selector generation
 */
export const IGNORED_ATTRIBUTES = new Set([
  'id', // handled separately
  'class', // handled separately
  'style', // unstable
  'xmlns', // service attribute for SVG
  'tabindex', // can change
  'contenteditable',
]);

/**
 * Default generator options
 * Note: cache is optional and not included in defaults
 */
export const DEFAULT_GENERATOR_OPTIONS: Omit<Required<GeneratorOptions>, 'cache'> &
  Pick<GeneratorOptions, 'cache'> = {
  maxPathDepth: MAX_PATH_DEPTH,
  enableSvgFingerprint: true,
  confidenceThreshold: 0.1,
  fallbackToBody: true,
  includeUtilityClasses: false,
  source: 'dom-dsl',
};

/**
 * Default resolver options
 */
export const DEFAULT_RESOLVER_OPTIONS: Required<ResolverOptions> = {
  strictMode: false,
  enableFallback: true,
  maxCandidates: 20,
};
