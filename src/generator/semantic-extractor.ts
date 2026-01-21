import type { ElementSemantics, TextContent, GeneratorOptions } from '../types';
import { normalizeText } from '../utils/text-normalizer';
import { filterClasses } from '../utils/class-filter';
import { isDynamicId, ID_REFERENCE_ATTRIBUTES, hasDynamicIdReference } from '../utils/id-validator';
import { ATTRIBUTE_PRIORITY, IGNORED_ATTRIBUTES } from '../utils/constants';
import { cleanAttributeValue } from '../utils/attribute-cleaner';
import { isStableAttribute } from '../utils/attribute-filters';
import type { EIDCache } from '../utils/eid-cache';

/**
 * Extracts semantic features from DOM elements
 * Following SPECIFICATION.md §10
 */
export class SemanticExtractor {
  private includeUtilityClasses: boolean;
  private cache?: EIDCache;

  constructor(options: GeneratorOptions, cache?: EIDCache) {
    this.includeUtilityClasses = options.includeUtilityClasses ?? false;
    this.cache = cache;
  }

  /**
   * Extracts semantic features from element
   * @param element - DOM element to extract from
   * @returns Semantic features object
   */
  extract(element: Element): ElementSemantics {
    // Check cache first
    if (this.cache) {
      const cached = this.cache.getSemantics(element);
      if (cached !== undefined) {
        return cached;
      }
    }

    const semantics: ElementSemantics = {};

    // ID (if stable)
    const id = element.id;
    if (id && !isDynamicId(id)) {
      semantics.id = id;
    }

    // Classes (filtered)
    if (element.classList.length > 0) {
      const classes = Array.from(element.classList);
      if (this.includeUtilityClasses) {
        semantics.classes = classes;
      } else {
        const { semantic } = filterClasses(classes);
        if (semantic.length > 0) {
          semantics.classes = semantic;
        }
      }
    }

    // Semantic attributes
    const attrs = this.extractAttributes(element);
    if (Object.keys(attrs).length > 0) {
      semantics.attributes = attrs;
    }

    // Role
    const role = element.getAttribute('role');
    if (role) {
      semantics.role = role;
    }

    // Text content (for certain elements)
    if (this.shouldExtractText(element)) {
      const text = this.extractText(element);
      if (text) {
        semantics.text = text;
      }
    }

    // Cache the result
    if (this.cache) {
      this.cache.setSemantics(element, semantics);
    }

    return semantics;
  }

  /**
   * Scores element based on semantic richness
   * @param element - Element to score
   * @returns Score from 0 to 1
   */
  scoreElement(element: Element): number {
    let score = 0.5; // Base score

    const semantics = this.extract(element);

    if (semantics.id) score += 0.15;
    if (semantics.classes && semantics.classes.length > 0) score += 0.1;
    if (semantics.attributes && Object.keys(semantics.attributes).length > 0) {
      score += 0.1;
    }
    if (semantics.role) score += 0.1;
    if (semantics.text) score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Checks if attribute should be ignored
   * @param attrName - Attribute name
   * @returns True if should be ignored
   */
  private shouldIgnoreAttribute(attrName: string): boolean {
    // Ignored attributes
    if (IGNORED_ATTRIBUTES.has(attrName)) return true;

    // Inline event handlers
    if (attrName.startsWith('on')) return true;

    // Angular/React service attributes
    if (attrName.startsWith('ng-') || attrName.startsWith('_ng')) return true;
    if (attrName.startsWith('data-reactid') || attrName.startsWith('data-react'))
      return true;
    if (attrName.startsWith('data-v-')) return true; // Vue scoped styles

    return false;
  }

  /**
   * Gets attribute priority
   * @param attrName - Attribute name
   * @returns Priority number (higher = more priority)
   */
  private getAttributePriority(attrName: string): number {
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

    return 0; // Don't use in selector
  }

  /**
   * Checks if attribute value is dynamic (should be ignored)
   * @param value - Attribute value
   * @returns True if value is dynamic
   */
  private isDynamicValue(value: string): boolean {
    const dynamicPatterns = [
      /^[a-f0-9]{32,}$/i, // Long hashes
      /^\d{10,}$/, // Timestamp
      /^(undefined|null|\[object)/, // JS artifacts
      /^{{.*}}$/, // Template literals
    ];

    return dynamicPatterns.some((p) => p.test(value));
  }

  /**
   * Extracts relevant semantic attributes from element
   * Iterates through all attributes and filters by priority
   */
  private extractAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};

    // Iterate through all attributes (not just SEMANTIC_ATTRIBUTES)
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name;

      // Skip ignored attributes
      if (this.shouldIgnoreAttribute(name)) continue;

      // Skip unstable/state-based attributes (e.g., aria-selected, data-state, disabled)
      if (!isStableAttribute(name, attr.value)) continue;

      // Skip ID-reference attributes with dynamic IDs
      if (ID_REFERENCE_ATTRIBUTES.has(name) && hasDynamicIdReference(attr.value)) {
        continue;
      }

      // Get priority
      const priority = this.getAttributePriority(name);
      if (priority === 0) continue;

      // Clean value for href/src
      const value =
        name === 'href' || name === 'src'
          ? cleanAttributeValue(name, attr.value)
          : attr.value;

      // Skip empty values
      if (!value || value.trim() === '') continue;

      // Skip dynamic values
      if (this.isDynamicValue(value)) continue;

      attrs[name] = value;
    }

    return attrs;
  }

  /**
   * Extracts and normalizes text content
   */
  private extractText(element: Element): TextContent | null {
    // Get direct text content, not from children
    const rawText = this.getDirectTextContent(element);
    if (!rawText) return null;

    const normalized = normalizeText(rawText);
    if (!normalized) return null;

    // Limit text length for performance
    const maxLength = 100;
    const truncatedRaw =
      rawText.length > maxLength ? rawText.slice(0, maxLength) + '...' : rawText;
    const truncatedNorm =
      normalized.length > maxLength
        ? normalized.slice(0, maxLength) + '...'
        : normalized;

    return {
      raw: truncatedRaw,
      normalized: truncatedNorm,
    };
  }

  /**
   * Gets direct text content excluding child elements
   */
  private getDirectTextContent(element: Element): string | null {
    const texts: string[] = [];

    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const trimmed = node.textContent.trim();
        if (trimmed) {
          texts.push(trimmed);
        }
      }
    }

    // Return direct text if found, otherwise fallback to textContent (with null safety)
    return texts.length > 0 ? texts.join(' ') : (element.textContent ?? null);
  }

  /**
   * Determines if text should be extracted for this element
   */
  private shouldExtractText(element: Element): boolean {
    const tag = element.tagName.toLowerCase();
    // Extract text for interactive and semantic text elements
    return [
      'button',
      'a',
      'label',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'span',
      'li',
      'th',
      'td',
      'dt',
      'dd',
      'legend',
      'figcaption',
      'summary',
    ].includes(tag);
  }

}
