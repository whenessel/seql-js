import type { ElementIdentity, AnchorNode, PathNode, TargetNode, ElementSemantics, GeneratorOptions, ResolverOptions } from '../types';
import { generateEID as generateEIDInternal } from '../generator';
import { resolve as resolveInternal } from '../resolver';
import { filterStableClasses } from './class-classifier';
import { ATTRIBUTE_PRIORITY, IGNORED_ATTRIBUTES } from './constants';
import { cleanAttributeValue } from './attribute-cleaner';

/**
 * Options for EIQ stringification
 */
export interface StringifyOptions {
  /** Maximum number of classes to include per node (default: 2) */
  maxClasses?: number;
  /** Maximum number of attributes to include per node (default: 5) */
  maxAttributes?: number;
  /** Include text content as pseudo-attribute (default: true) */
  includeText?: boolean;
  /** Maximum text length to include (default: 50) */
  maxTextLength?: number;
  /** Simplify target node by removing redundant info (default: true) */
  simplifyTarget?: boolean;
  /** Include resolution constraints in EIQ string (default: true) */
  includeConstraints?: boolean;
}

/**
 * Default stringify options
 */
const DEFAULT_STRINGIFY_OPTIONS: Required<StringifyOptions> = {
  maxClasses: 2,
  maxAttributes: 5,
  includeText: true,
  maxTextLength: 50,
  simplifyTarget: true,
  includeConstraints: true,
};

/**
 * Gets attribute priority for sorting
 */
function getAttributePriority(attrName: string): number {
  // ID is highest priority for EIQ
  if (attrName === 'id') return 101;

  // Exact match
  if (ATTRIBUTE_PRIORITY[attrName] !== undefined) {
    return ATTRIBUTE_PRIORITY[attrName];
  }

  // data-* wildcard
  if (attrName.startsWith('data-')) {
    return ATTRIBUTE_PRIORITY['data-*'];
  }

  // aria-* wildcard
  if (attrName.startsWith('aria-')) {
    return ATTRIBUTE_PRIORITY['aria-*'];
  }

  return 0;
}

/**
 * Checks if attribute is considered unique identifier
 */
function isUniqueAttribute(attrName: string): boolean {
  return ['id', 'data-testid', 'data-qa', 'data-cy', 'href', 'text', 'role'].includes(attrName);
}

/**
 * Simple PII detection for text content
 */
function isTextPII(text: string): boolean {
  // Email pattern
  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return true;

  // Phone pattern (basic)
  if (/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)) return true;

  // Credit card pattern (basic)
  if (/\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/.test(text)) return true;

  return false;
}

/**
 * Converts EID to canonical EIQ string representation
 *
 * Requirements (per EIQ_SPECIFICATION_v1.0.md):
 * - Deterministic (same EID → same EIQ)
 * - Canonical (one EID → one EIQ)
 * - Versioned (includes protocol version)
 * - PII-safe (no personal data)
 * - Sorted attributes and classes
 *
 * @param eid - Element Identity Descriptor
 * @param options - Optional stringify options
 * @returns Element Identity Query (canonical string)
 *
 * @example
 * ```typescript
 * const eid = generateEID(element);
 * const eiq = stringifyEID(eid);
 * // "v1: footer :: ul.menu > li#3 > a[href="/contact"]"
 * ```
 */
export function stringifyEID(eid: ElementIdentity, options?: StringifyOptions): string {
  const opts = { ...DEFAULT_STRINGIFY_OPTIONS, ...options };

  const version = `v${eid.version}`;
  const anchor = stringifyNode(eid.anchor, false, opts);
  const path = eid.path.length > 0
    ? eid.path.map(node => stringifyNode(node, false, opts)).join(' > ') + ' > '
    : '';
  const target = stringifyNode(eid.target, true, opts); // Pass isTarget=true

  // Constraints are optional
  const constraints = opts.includeConstraints ? stringifyConstraints(eid) : '';

  return `${version}: ${anchor} :: ${path}${target}${constraints}`;
}

/**
 * Parses EIQ string back to EID structure
 *
 * @param eiq - Element Identity Query (string)
 * @returns Element Identity Descriptor
 * @throws {Error} if EIQ is malformed or version unsupported
 *
 * @example
 * ```typescript
 * const eiq = "v1: footer :: ul > li#3 > a[href='/contact']";
 * const eid = parseEIQ(eiq);
 * const elements = resolve(eid, document);
 * ```
 */
export function parseEIQ(eiq: string): ElementIdentity {
  // Trim whitespace
  eiq = eiq.trim();

  // Parse version
  const versionMatch = eiq.match(/^v(\d+(?:\.\d+)?)\s*:\s*/);
  if (!versionMatch) {
    throw new Error('Invalid EIQ: missing version prefix (expected "v1:")');
  }

  const version = versionMatch[1];
  if (version !== '1.0' && version !== '1') {
    throw new Error(`Unsupported EIQ version: v${version} (only v1.0 is supported)`);
  }

  // Remove version prefix
  let remaining = eiq.slice(versionMatch[0].length);

  // Parse anchor (up to ::)
  const anchorMatch = remaining.match(/^(.+?)\s*::\s*/);
  if (!anchorMatch) {
    throw new Error('Invalid EIQ: missing anchor separator "::"');
  }

  const anchorStr = anchorMatch[1].trim();
  remaining = remaining.slice(anchorMatch[0].length);

  // Parse path and target (split by >)
  // Need to handle constraints {} at the end
  const constraintsMatch = remaining.match(/\s*\{([^}]+)\}\s*$/);
  let constraintsStr = '';
  if (constraintsMatch) {
    constraintsStr = constraintsMatch[1];
    remaining = remaining.slice(0, constraintsMatch.index);
  }

  // Split by > to get path nodes and target
  const nodes = remaining.split(/\s*>\s*/).map(n => n.trim()).filter(n => n);

  if (nodes.length === 0) {
    throw new Error('Invalid EIQ: missing target node');
  }

  // Last node is target, rest are path
  const targetStr = nodes[nodes.length - 1];
  const pathStrs = nodes.slice(0, -1);

  // Parse nodes
  const anchor = parseNode(anchorStr, true) as AnchorNode;
  const path = pathStrs.map(str => parseNode(str, false) as PathNode);
  const target = parseNode(targetStr, false) as TargetNode;

  // Parse constraints
  const constraints = parseConstraints(constraintsStr);

  // Build EID structure
  const eid: ElementIdentity = {
    version: '1.0',
    anchor,
    path,
    target,
    constraints,
    fallback: {
      onMultiple: 'best-score',
      onMissing: 'anchor-only',
      maxDepth: 10,
    },
    meta: {
      confidence: 0.7,
      generatedAt: new Date().toISOString(),
      generator: `eiq-parser@1.0`,
      source: 'eiq-string',
      degraded: false,
    },
  };

  return eid;
}

/**
 * Stringify a single node (anchor, path, or target)
 */
function stringifyNode(
  node: AnchorNode | PathNode | TargetNode,
  isTarget: boolean = false,
  options: Required<StringifyOptions> = DEFAULT_STRINGIFY_OPTIONS
): string {
  const { tag, semantics } = node;
  let result = tag;

  // 1. Prepare Attributes (including ID and Role)
  const attrStrings: string[] = [];
  const rawAttributes = { ...semantics.attributes };

  // In EIQ, ID is just another attribute [id="..."]
  if (semantics.id) {
    rawAttributes.id = semantics.id;
  }

  // Include Role if present in semantics but not in attributes
  if (semantics.role && !rawAttributes.role) {
    rawAttributes.role = semantics.role;
  }

  const processedAttrs = Object.entries(rawAttributes)
    .map(([name, value]) => {
      const priority = getAttributePriority(name);
      const cleanedValue = (name === 'href' || name === 'src')
        ? cleanAttributeValue(name, value)
        : value;
      return { name, value: cleanedValue, priority };
    })
    .filter(attr => {
      // Filter out truly ignored attributes (style, xmlns, etc)
      const trulyIgnored = ['style', 'xmlns', 'tabindex', 'contenteditable'];
      if (trulyIgnored.includes(attr.name)) return false;

      // Keep if priority > 0 or it's a role or id
      return attr.priority > 0 || attr.name === 'role' || attr.name === 'id';
    });

  // Sort by priority (desc) to pick the best ones
  processedAttrs.sort((a, b) => b.priority - a.priority);

  // Pick top N attributes
  const topAttrs = processedAttrs.slice(0, options.maxAttributes);

  // Sort selected attributes ALPHABETICALLY for EIQ canonical format
  topAttrs.sort((a, b) => a.name.localeCompare(b.name));

  for (const { name, value } of topAttrs) {
    attrStrings.push(`${name}="${escapeAttributeValue(value)}"`);
  }

  // Add text as pseudo-attribute if enabled
  if (options.includeText && semantics.text && !isTextPII(semantics.text.normalized)) {
    const text = semantics.text.normalized;
    if (text.length > 0 && text.length <= options.maxTextLength) {
      attrStrings.push(`text="${escapeAttributeValue(text)}"`);
    }
  }

  if (attrStrings.length > 0) {
    let finalAttrs = attrStrings;

    // Advanced simplification for target node
    if (isTarget && options.simplifyTarget && semantics.id) {
       // If we have ID, we can afford to be more selective,
       // but we MUST keep important semantic info like href, text, data-testid
       finalAttrs = attrStrings.filter(s => {
         const name = s.split('=')[0];
         const priority = getAttributePriority(name);
         // Keep high priority attributes (id, data-testid, href, src, role, text)
         return priority >= 60 || name === 'text' || name === 'id' || name === 'role';
       });
    }

    if (finalAttrs.length > 0) {
      // Final alphabetical sort for the attributes in the bracket
      finalAttrs.sort((a, b) => a.localeCompare(b));
      result += `[${finalAttrs.join(',')}]`;
    }
  }

  // 2. Add stable classes
  if (semantics.classes && semantics.classes.length > 0) {
    const stableClasses = filterStableClasses(semantics.classes);

    // If simplifying target and we have strong identifiers, we can skip classes
    const hasStrongIdentifier = !!semantics.id ||
      attrStrings.some(s => s.startsWith('href=') || s.startsWith('data-testid=') || s.startsWith('text=') || s.startsWith('role='));
    const skipClasses = isTarget && options.simplifyTarget && hasStrongIdentifier;

    if (!skipClasses && stableClasses.length > 0) {
      const limitedClasses = stableClasses
        .sort() // Alphabetical for determinism
        .slice(0, options.maxClasses);

      result += limitedClasses.map(c => `.${c}`).join('');
    }
  }

  // 3. Add position (nth-child)
  if ('nthChild' in node && node.nthChild) {
    // EIQ position is #N
    const hasStrongIdentifier = !!semantics.id ||
      (semantics.attributes && Object.keys(semantics.attributes).some(isUniqueAttribute));

    const skipPosition = isTarget && options.simplifyTarget && hasStrongIdentifier;

    if (!skipPosition) {
      result += `#${node.nthChild}`;
    }
  }

  return result;
}

/**
 * Stringify constraints
 */
function stringifyConstraints(eid: ElementIdentity): string {
  if (!eid.constraints || eid.constraints.length === 0) {
    return '';
  }

  // Convert constraints to key=value pairs
  const pairs: string[] = [];

  for (const constraint of eid.constraints) {
    switch (constraint.type) {
      case 'uniqueness':
        pairs.push('unique=true');
        break;
      case 'visibility':
        if (constraint.params && constraint.params.required) {
          pairs.push('visible=true');
        }
        break;
      case 'position':
        if (constraint.params && constraint.params.strategy) {
          pairs.push(`pos=${constraint.params.strategy}`);
        }
        break;
      case 'text-proximity':
        if (constraint.params && constraint.params.reference) {
          const escaped = escapeAttributeValue(String(constraint.params.reference));
          pairs.push(`text="${escaped}"`);
        }
        break;
    }
  }

  if (pairs.length === 0) {
    return '';
  }

  return ` {${pairs.join(',')}}`;
}

/**
 * Parse a single node string into node structure
 */
function parseNode(nodeStr: string, isAnchor: boolean): AnchorNode | PathNode {
  // Pattern: tag(.class)*[attr=value,attr=value]#position

  let remaining = nodeStr;
  const semantics: ElementSemantics = {};

  // Extract tag (required)
  const tagMatch = remaining.match(/^([a-z][a-z0-9-]*)/);
  if (!tagMatch) {
    throw new Error(`Invalid node: missing tag name in "${nodeStr}"`);
  }
  const tag = tagMatch[1];
  remaining = remaining.slice(tag.length);

  // Extract classes
  const classes: string[] = [];
  let classMatch;
  while ((classMatch = remaining.match(/^\.([a-zA-Z][a-zA-Z0-9-_]*)/))) {
    classes.push(classMatch[1]);
    remaining = remaining.slice(classMatch[0].length);
  }
  if (classes.length > 0) {
    semantics.classes = classes;
  }

  // Extract attributes [...]
  const attrMatch = remaining.match(/^\[([^\]]+)\]/);
  if (attrMatch) {
    const attrsStr = attrMatch[1];
    const attributes: Record<string, string> = {};

    // Split by comma (but not inside quotes)
    const attrPairs = splitAttributes(attrsStr);

    for (const pair of attrPairs) {
      // Match attribute with escaped quotes: key="value with \" inside"
      const eqMatch = pair.match(/^([a-z][a-z0-9-]*)(?:=|~=)"((?:[^"\\]|\\.)*)"/);
      if (eqMatch) {
        const [, key, value] = eqMatch;
        attributes[key] = unescapeAttributeValue(value);
      }
    }

    if (Object.keys(attributes).length > 0) {
      // Special handling for pseudo-attributes in EIQ
      if (attributes.text) {
        semantics.text = {
          raw: attributes.text,
          normalized: attributes.text
        };
        delete attributes.text;
      }

      if (attributes.id) {
        semantics.id = attributes.id;
        delete attributes.id;
      }

      if (attributes.role) {
        semantics.role = attributes.role;
        delete attributes.role;
      }

      if (Object.keys(attributes).length > 0) {
        semantics.attributes = attributes;
      }
    }

    remaining = remaining.slice(attrMatch[0].length);
  }

  // Extract position #N
  let nthChild: number | undefined;
  const posMatch = remaining.match(/^#(\d+)/);
  if (posMatch) {
    nthChild = parseInt(posMatch[1], 10);
    remaining = remaining.slice(posMatch[0].length);
  }

  // Check for remaining unparsed content
  if (remaining.trim()) {
    throw new Error(`Invalid node: unexpected content "${remaining}" in "${nodeStr}"`);
  }

  // Build node
  if (isAnchor) {
    return {
      tag,
      semantics,
      score: 0.7,
      degraded: false,
    };
  } else {
    return {
      tag,
      semantics,
      score: 0.7,
      nthChild,
    };
  }
}

/**
 * Parse constraints string
 */
function parseConstraints(constraintsStr: string): any[] {
  if (!constraintsStr.trim()) {
    return [];
  }

  const constraints: any[] = [];
  const pairs = constraintsStr.split(',').map(p => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s.trim());

    switch (key) {
      case 'unique':
        if (value === 'true') {
          constraints.push({
            type: 'uniqueness',
            params: {
              mode: 'strict',
            },
            priority: 90,
          });
        }
        break;
      case 'visible':
        if (value === 'true') {
          constraints.push({
            type: 'visibility',
            params: {
              required: true,
            },
            priority: 80,
          });
        }
        break;
      case 'pos':
        constraints.push({
          type: 'position',
          params: {
            strategy: value,
          },
          priority: 70,
        });
        break;
      case 'text':
        // Remove quotes
        const text = value.replace(/^"(.*)"$/, '$1');
        constraints.push({
          type: 'text-proximity',
          params: {
            reference: unescapeAttributeValue(text),
            maxDistance: 5,
          },
          priority: 60,
        });
        break;
    }
  }

  return constraints;
}

/**
 * Split attribute string by comma (respecting quotes)
 */
function splitAttributes(attrsStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < attrsStr.length; i++) {
    const char = attrsStr[i];

    if (char === '"' && (i === 0 || attrsStr[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * Escape attribute value for EIQ string
 */
function escapeAttributeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/"/g, '\\"')     // Quote
    .replace(/>/g, '\\>')     // Greater-than
    .replace(/:/g, '\\:');    // Colon
}

/**
 * Unescape attribute value from EIQ string
 * Must process in reverse order to avoid double-unescaping
 */
function unescapeAttributeValue(value: string): string {
  return value
    .replace(/\\\\/g, '\x00')   // Temporary placeholder for backslash
    .replace(/\\"/g, '"')
    .replace(/\\>/g, '>')
    .replace(/\\:/g, ':')
    .replace(/\x00/g, '\\');     // Restore backslash
}

// ============================================================================
// Facade Functions
// ============================================================================

/**
 * Generate EIQ string directly from DOM element
 *
 * This is a convenience function that combines generateEID() and stringifyEID().
 *
 * @param element - Target DOM element
 * @param generatorOptions - Optional generation options
 * @param stringifyOptions - Optional stringify options
 * @returns Element Identity Query (canonical string)
 *
 * @example
 * ```typescript
 * const button = document.querySelector('.submit-button');
 * const eiq = generateEIQ(button);
 * // "v1: form :: div.actions > button[type="submit",text="Submit Order"]"
 *
 * // Send to analytics
 * gtag('event', 'click', { element_identity: eiq });
 * ```
 */
export function generateEIQ(
  element: Element,
  generatorOptions?: GeneratorOptions,
  stringifyOptions?: StringifyOptions
): string | null {
  const eid = generateEIDInternal(element, generatorOptions);
  if (!eid) {
    return null;
  }
  return stringifyEID(eid, stringifyOptions);
}

/**
 * Resolve EIQ string directly to DOM elements
 *
 * This is a convenience function that combines parseEIQ() and resolve().
 *
 * @param eiq - Element Identity Query (string)
 * @param root - Root element or document to search in
 * @param options - Optional resolver options
 * @returns Array of matched elements (empty if not found)
 *
 * @example
 * ```typescript
 * // Parse EIQ from analytics
 * const eiq = "v1: form :: button.submit";
 * const elements = resolveEIQ(eiq, document);
 *
 * if (elements.length > 0) {
 *   highlightElement(elements[0]);
 * }
 * ```
 */
export function resolveEIQ(
  eiq: string,
  root: Document | Element,
  options?: ResolverOptions
): Element[] {
  try {
    const eid = parseEIQ(eiq);
    const result = resolveInternal(eid, root, options);
    return result.elements || [];
  } catch (error) {
    console.error('Failed to resolve EIQ:', error);
    return [];
  }
}
