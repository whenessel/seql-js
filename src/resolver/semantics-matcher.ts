import type { ElementSemantics, TextContent, SvgFingerprint } from '../types';
import { normalizeText } from '../utils/text-normalizer';

/**
 * Filters elements by semantic criteria
 * Following SPECIFICATION.md §13.2
 */
export class SemanticsMatcher {
  /**
   * Filters elements that match the semantics
   * @param elements - Candidate elements
   * @param semantics - Target semantics to match
   * @returns Filtered elements that match
   */
  match(elements: Element[], semantics: ElementSemantics): Element[] {
    return elements.filter((el) => this.matchElement(el, semantics));
  }

  /**
   * Checks if a single element matches the semantics
   */
  private matchElement(element: Element, semantics: ElementSemantics): boolean {
    // Match text (if specified)
    if (semantics.text && !this.matchText(element, semantics.text)) {
      return false;
    }

    // Match attributes (if specified)
    if (semantics.attributes && !this.matchAttributes(element, semantics.attributes)) {
      return false;
    }

    // Match SVG fingerprint (if specified)
    if (semantics.svg && !this.matchSvgFingerprint(element as SVGElement, semantics.svg)) {
      return false;
    }

    return true;
  }

  /**
   * Matches text content
   * Prioritizes direct text nodes, but falls back to full textContent if no direct text
   */
  matchText(element: Element, text: TextContent): boolean {
    // Prioritize direct text nodes
    const directTextNodes = Array.from(element.childNodes).filter(
      (node) => node.nodeType === Node.TEXT_NODE
    );

    const directText = directTextNodes.map((node) => node.textContent?.trim() ?? '').join(' ');

    // If no direct text nodes, use full textContent as fallback
    // This handles cases like <td><button>18</button></td> where text is in child element
    const textToMatch = directText || (element.textContent?.trim() ?? '');

    if (!textToMatch) return false;

    const normalized = normalizeText(textToMatch);

    // Support partial matching with option (default is exact)
    return text.matchMode === 'partial'
      ? normalized.includes(text.normalized)
      : normalized === text.normalized;
  }

  /**
   * Matches attributes
   */
  matchAttributes(element: Element, attrs: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(attrs)) {
      const elementValue = element.getAttribute(key);
      if (elementValue !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Matches SVG fingerprint
   */
  matchSvgFingerprint(element: SVGElement, fingerprint: SvgFingerprint): boolean {
    // Match shape
    if (element.tagName.toLowerCase() !== fingerprint.shape) {
      return false;
    }

    // Match dHash for path elements
    if (fingerprint.dHash && fingerprint.shape === 'path') {
      const d = element.getAttribute('d');
      if (d) {
        const hash = this.computePathHash(d);
        if (hash !== fingerprint.dHash) {
          return false;
        }
      }
    }

    // Match geomHash for non-path shapes (circle, rect, ellipse, line)
    if (fingerprint.geomHash && ['circle', 'rect', 'ellipse', 'line'].includes(fingerprint.shape)) {
      const computed = this.computeGeomHash(element, fingerprint.shape);
      if (computed !== fingerprint.geomHash) {
        return false;
      }
    }

    // Match title text
    if (fingerprint.titleText) {
      const title = element.querySelector('title');
      if (title?.textContent?.trim() !== fingerprint.titleText) {
        return false;
      }
    }

    return true;
  }

  /**
   * Computes simple path hash (matching SvgFingerprinter)
   */
  private computePathHash(d: string): string {
    const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) ?? [];
    const firstN = commands.slice(0, 5);

    const normalized = firstN
      .map((cmd) => {
        return cmd.trim().replace(/(-?\d+\.?\d*)/g, (match) => {
          return parseFloat(match).toFixed(1);
        });
      })
      .join(' ');

    return this.simpleHash(normalized);
  }

  /**
   * Computes geometry hash for non-path shapes (matching SvgFingerprinter)
   */
  private computeGeomHash(element: SVGElement, shape: string): string {
    const attrs: string[] = [];

    switch (shape) {
      case 'circle':
        attrs.push(`r=${element.getAttribute('r') ?? '0'}`);
        break;

      case 'rect': {
        const w = parseFloat(element.getAttribute('width') ?? '0');
        const h = parseFloat(element.getAttribute('height') ?? '0');
        if (w > 0 && h > 0) {
          attrs.push(`ratio=${(w / h).toFixed(2)}`);
        }
        break;
      }

      case 'ellipse': {
        const rx = parseFloat(element.getAttribute('rx') ?? '0');
        const ry = parseFloat(element.getAttribute('ry') ?? '0');
        if (rx > 0 && ry > 0) {
          attrs.push(`ratio=${(rx / ry).toFixed(2)}`);
        }
        break;
      }

      case 'line': {
        const x1 = parseFloat(element.getAttribute('x1') ?? '0');
        const y1 = parseFloat(element.getAttribute('y1') ?? '0');
        const x2 = parseFloat(element.getAttribute('x2') ?? '0');
        const y2 = parseFloat(element.getAttribute('y2') ?? '0');
        const angle = Math.atan2(y2 - y1, x2 - x1);
        attrs.push(`angle=${angle.toFixed(2)}`);
        break;
      }
    }

    return this.simpleHash(attrs.join(';'));
  }

  /**
   * Simple hash function (matching SvgFingerprinter)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}
