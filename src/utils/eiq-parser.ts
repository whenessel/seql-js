import type { ElementIdentity, AnchorNode, PathNode, TargetNode, ElementSemantics, GeneratorOptions, ResolverOptions } from '../types';
import { generateEID as generateEIDInternal } from '../generator';
import { resolve as resolveInternal } from '../resolver';

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
 * @returns Element Identity Query (canonical string)
 *
 * @example
 * ```typescript
 * const eid = generateEID(element);
 * const eiq = stringifyEID(eid);
 * // "v1: footer :: ul.menu > li#3 > a[href="/contact"]"
 * ```
 */
export function stringifyEID(eid: ElementIdentity): string {
  const version = `v${eid.version}`;
  const anchor = stringifyNode(eid.anchor);
  const path = eid.path.length > 0
    ? eid.path.map(node => stringifyNode(node)).join(' > ') + ' > '
    : '';
  const target = stringifyNode(eid.target);

  // Constraints are optional
  const constraints = stringifyConstraints(eid);

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
function stringifyNode(node: AnchorNode | PathNode | TargetNode): string {
  const { tag, semantics } = node;
  let result = tag;

  // Add classes (semantic only, sorted)
  if (semantics.classes && semantics.classes.length > 0) {
    const sortedClasses = [...semantics.classes].sort();
    result += sortedClasses.map(c => `.${c}`).join('');
  }

  // Add attributes (sorted alphabetically)
  if (semantics.attributes && Object.keys(semantics.attributes).length > 0) {
    const attrs = Object.entries(semantics.attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        // Escape quotes in value
        const escapedValue = escapeAttributeValue(value);
        return `${key}="${escapedValue}"`;
      });
    result += `[${attrs.join(',')}]`;
  }

  // Add position (nth-child)
  if ('nthChild' in node && node.nthChild) {
    result += `#${node.nthChild}`;
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
      semantics.attributes = attributes;
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
 * @param options - Optional generation options
 * @returns Element Identity Query (canonical string)
 *
 * @example
 * ```typescript
 * const button = document.querySelector('.submit-button');
 * const eiq = generateEIQ(button);
 * // "v1: form[#checkout] :: div.actions > button.submit['Submit Order']"
 *
 * // Send to analytics
 * gtag('event', 'click', { element_identity: eiq });
 * ```
 */
export function generateEIQ(element: Element, options?: GeneratorOptions): string | null {
  const eid = generateEIDInternal(element, options);
  if (!eid) {
    return null;
  }
  return stringifyEID(eid);
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
