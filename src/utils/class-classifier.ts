/**
 * Class classification for CSS selector generation
 * Categorizes classes into dynamic, utility, and semantic classes
 */

/**
 * Classification result for a CSS class
 */
export interface ClassClassification {
  /** Whether class is dynamically generated (CSS-in-JS, hashes) */
  isDynamic: boolean;
  /** Whether class is a utility class (Tailwind, Bootstrap, animations) */
  isUtility: boolean;
  /** Whether class has semantic meaning */
  isSemantic: boolean;
  /** Whether class is stable (not dynamic and not utility) */
  isStable: boolean;
}

/**
 * Patterns for detecting dynamically generated classes
 * These classes should be IGNORED in selectors
 */
const DYNAMIC_CLASS_PATTERNS = [
  // CSS-in-JS
  /^css-[a-z0-9]+$/i,
  /^sc-[a-z0-9]+-\d+$/i,
  /^[a-z]{5,8}$/i, // Short generated classes (abcdef)

  // Material-UI / MUI
  /^Mui[A-Z]\w+-\w+-\w+/,
  /^makeStyles-\w+-\d+$/,

  // JSS
  /^jss\d+$/,

  // Emotion / Linaria
  /^(emotion|linaria)-[a-z0-9]+/i,

  // Component libraries with hashes
  /^(chakra|tw-|ant-)[a-z0-9]+-\w+/i,

  // Hash-based (hashes in classes)
  /-[a-f0-9]{6,}$/i,
  /^_[a-z0-9]{5,}$/i,
  /\d{5,}/, // 5+ digits in a row
];

/**
 * Patterns for detecting utility classes
 * These classes should be IGNORED in selectors
 */
const UTILITY_CLASS_PATTERNS = [
  // === FIX 4: Tailwind arbitrary values and variants (highest priority) ===
  /^\[/, // Any arbitrary value or variant starting with [ (e.g., [&_svg]:..., [mask-type:luminance])

  // === FIX 4: Pseudo-class variants (must be before specific patterns) ===
  /^(first|last|odd|even|only|first-of-type|last-of-type|only-of-type):/, // first:, last:, etc.
  /^(hover|focus|active|disabled|enabled|checked|indeterminate|default|required|valid|invalid|in-range|out-of-range|placeholder-shown|autofill|read-only):/, // State pseudo-classes
  /^(focus-within|focus-visible|visited|target|open):/, // Advanced pseudo-classes

  // === FIX 4: Responsive variants (must be before specific patterns) ===
  /^(sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl):/,

  // === FIX 4: Dark mode and directional variants ===
  /^dark:/,
  /^(rtl|ltr):/,

  // === FIX 4: Group and peer variants ===
  /^(group|peer)(-hover|-focus|-active)?:/,

  // === FIX 4: Tailwind utilities with fraction values ===
  /\/([\d.]+|full|auto|screen)$/, // /50, /100, /full, /auto, /screen

  // === FIX 4: Positioning utilities ===
  /^(inset|top|right|bottom|left)(-|$)/, // inset-0, top-0, left-0

  // === Layout & Display ===
  /^(flex|inline-flex|grid|block|inline|inline-block|hidden|visible)$/,
  /^(absolute|relative|fixed|sticky|static)$/,

  // === Flexbox & Grid ===
  /^(items|justify|content|self|place)-/,
  /^flex-(row|col|wrap|nowrap|1|auto|initial|none)/,
  /^grid-(cols|rows|flow)/,

  // === Spacing (Tailwind) ===
  /^(gap|space)-/,
  /^[mp][trblxy]?-(\d+|auto|px)$/,

  // === Sizing ===
  /^(w|h|min-w|min-h|max-w|max-h|size)-/,

  // === Colors & Styling ===
  // Note: text-* can be semantic (text-muted, text-primary) or utility (text-center, text-lg)
  // More specific patterns for utility text-* classes
  /^text-(center|left|right|justify|start|end|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
  /^text-(uppercase|lowercase|capitalize|normal-case|underline|line-through|no-underline)$/,
  /^text-(truncate|ellipsis|clip)$/,
  /^(bg|border|ring|shadow|outline)-/,
  /^rounded(-|$)/,

  // === Typography ===
  /^(font|leading|tracking|whitespace|break|truncate)-/,
  /^(uppercase|lowercase|capitalize|normal-case)$/,

  // === Transform & Animation (IMPORTANT!) ===
  /^(transform|transition|duration|delay|ease|animate)-/,
  /^(scale|rotate|translate|skew)-/,
  /^transform$/,
  /^backdrop-blur-/,
  /^motion-/, // Framer Motion
  /^(fade|slide|zoom|bounce|pulse|spin|ping)-/, // animations

  // === Overflow & Scrolling ===
  /^(overflow|overscroll|scroll)-/,

  // === Interactivity ===
  /^(cursor|pointer-events|select|resize)-/,

  // === Visibility & Opacity ===
  /^(opacity|z)-/,
  /^(visible|invisible|collapse)$/,

  // === Bootstrap utilities ===
  /^d-(none|inline|inline-block|block|grid|table|flex)$/,
  /^(float|clearfix|text)-(left|right|center|justify|start|end)$/,
  /^(m|p)[trblxy]?-[0-5]$/,
  /^(w|h)-(25|50|75|100|auto)$/,
  // Note: btn-* classes are semantic (component classes), not utility
  // /^btn-(primary|secondary|success|danger|warning|info|light|dark|link)$/,
  /^btn-(sm|lg|block)$/, // Only size modifiers are utility
  /^text-(muted|primary|success|danger|warning|info|light|dark|white)$/,
  /^bg-(primary|secondary|success|danger|warning|info|light|dark|white|transparent)$/,
  /^border(-top|-bottom|-left|-right)?(-0)?$/,
  /^rounded(-top|-bottom|-left|-right|-circle|-pill|-0)?$/,
  /^shadow(-sm|-lg|-none)?$/,
  /^(align|justify|order|flex)-(start|end|center|between|around|fill|grow|shrink)$/,
  /^col(-sm|-md|-lg|-xl)?(-\d+|-auto)?$/,
  /^row(-cols)?(-\d+)?$/,
  /^g[xy]?-[0-5]$/,
  /^(show|hide|invisible|visible)$/,
  /^(position|top|bottom|start|end)-(static|relative|absolute|fixed|sticky|-\d+)$/,

  // === Common utility patterns ===
  /^(row|col)$/,
  /^clearfix$/,
  /^pull-(left|right)$/,
  /^float-(left|right|none)$/,
];

/**
 * Patterns for detecting semantic classes
 * These classes should be USED in selectors
 */
const SEMANTIC_CLASS_PATTERNS = [
  // === Navigation ===
  /^(nav|menu|header|footer|sidebar|topbar|navbar|breadcrumb)/,
  /(navigation|dropdown|megamenu)$/,

  // === Components ===
  /^(btn|button|link|card|modal|dialog|popup|tooltip|alert|badge|chip)/,
  /^(form|input|select|checkbox|radio|textarea|label|fieldset)/,
  /^(table|list|item|row|cell|column)/,
  /^(accordion|tab|carousel|slider|gallery)/,

  // === Content ===
  /^(content|main|article|post|comment|title|subtitle|description|caption)/,
  /^(hero|banner|jumbotron|section|wrapper|box)/,

  // === User/Data ===
  /^(user|profile|avatar|account|auth)/,
  /^(product|item|price|cart|checkout|order)/,

  // === Layout sections ===
  /^(page|layout|panel|widget|block)/,

  // === States (semantic naming) ===
  /-(primary|secondary|tertiary|success|error|warning|info|danger)$/,
  /-(active|inactive|disabled|enabled|selected|highlighted|focused)$/,
  /-(open|closed|expanded|collapsed|visible|hidden)$/,
  /-(large|medium|small|tiny|xs|sm|md|lg|xl)$/,

  // === Action buttons ===
  /^(submit|cancel|close|delete|edit|save|back|next|prev|search)/,

  // === Status ===
  /^(loading|pending|complete|failed|draft|published)/,
];

/**
 * Classifies a CSS class into categories
 * @param className - Class name to classify
 * @returns Classification result
 */
export function classifyClass(className: string): ClassClassification {
  const isDynamic = isDynamicClass(className);
  const isUtility = isUtilityClass(className);
  const isSemantic = isSemanticClass(className);
  const isStable = !isDynamic && !isUtility;

  return {
    isDynamic,
    isUtility,
    isSemantic,
    isStable,
  };
}

/**
 * Checks if class is dynamically generated (CSS-in-JS, hashes)
 * @param className - Class name to check
 * @returns True if dynamic class
 */
export function isDynamicClass(className: string): boolean {
  return DYNAMIC_CLASS_PATTERNS.some((pattern) => pattern.test(className));
}

/**
 * Checks if class is a utility class (Tailwind, Bootstrap, animations)
 * @param className - Class name to check
 * @returns True if utility class
 */
export function isUtilityClass(className: string): boolean {
  // Very short classes are often utility
  if (className.length <= 2) return true;

  // Classes that are just numbers or start with numbers
  if (/^\d/.test(className)) return true;

  // Check utility patterns
  return UTILITY_CLASS_PATTERNS.some((pattern) => pattern.test(className));
}

/**
 * Checks if class has semantic meaning
 * @param className - Class name to check
 * @returns True if semantic class
 */
export function isSemanticClass(className: string): boolean {
  // Must not be dynamic or utility
  if (isDynamicClass(className) || isUtilityClass(className)) {
    return false;
  }

  // Check semantic patterns
  return SEMANTIC_CLASS_PATTERNS.some((pattern) => pattern.test(className));
}

/**
 * Checks if class is stable (not dynamic and not utility)
 * @param className - Class name to check
 * @returns True if stable class
 */
export function isStableClass(className: string): boolean {
  return !isDynamicClass(className) && !isUtilityClass(className);
}

/**
 * Filters classes to keep only stable ones (not dynamic and not utility)
 * @param classes - Array of class names
 * @returns Array of stable class names
 */
export function filterStableClasses(classes: string[]): string[] {
  return classes.filter((cls) => isStableClass(cls));
}

/**
 * Filters classes to keep only semantic ones
 * @param classes - Array of class names
 * @returns Array of semantic class names
 */
export function filterSemanticClasses(classes: string[]): string[] {
  return classes.filter((cls) => isSemanticClass(cls));
}

/**
 * Scores a class for semantic value (0-1)
 * Higher score = more semantic value
 * @param className - Class name to score
 * @returns Score from 0 to 1
 */
export function scoreClass(className: string): number {
  // Dynamic or utility classes get 0
  if (isDynamicClass(className) || isUtilityClass(className)) {
    return 0;
  }

  let score = 0.5; // Base score for stable classes

  // Semantic classes get higher score
  if (isSemanticClass(className)) {
    score = 0.8;
  }

  // Short classes are less semantic
  if (className.length < 3) {
    score *= 0.3;
  } else if (className.length < 5) {
    score *= 0.6;
  }

  // Numeric parts reduce score (but not to 0 if already stable)
  if (/\d/.test(className)) {
    score *= 0.7;
  }

  return Math.min(score, 1.0);
}
