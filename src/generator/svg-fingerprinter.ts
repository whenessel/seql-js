import type { SvgFingerprint } from '../types';

/**
 * Generates stable fingerprints for SVG elements
 * Following SPECIFICATION.md §9
 */
export class SvgFingerprinter {
  /**
   * Generates fingerprint for SVG element
   * @param element - SVG element to fingerprint
   * @returns SVG fingerprint object
   */
  fingerprint(element: SVGElement): SvgFingerprint {
    const tag = element.tagName.toLowerCase();
    const shape = this.getShape(tag);

    const fingerprint: SvgFingerprint = {
      shape,
      hasAnimation: this.hasAnimation(element),
    };

    // Path-specific hash
    if (shape === 'path') {
      const d = element.getAttribute('d');
      if (d) {
        fingerprint.dHash = this.computePathHash(d);
      }
    } else if (['circle', 'rect', 'ellipse', 'line'].includes(shape)) {
      fingerprint.geomHash = this.computeGeomHash(element, shape);
    }

    // ARIA role
    const role = element.getAttribute('role');
    if (role) {
      fingerprint.role = role;
    }

    // Title text (accessibility)
    const title = element.querySelector('title');
    if (title?.textContent) {
      fingerprint.titleText = title.textContent.trim();
    }

    return fingerprint;
  }

  /**
   * Computes hash from path data (first N commands)
   * @param d - SVG path d attribute value
   * @returns Hash string
   */
  computePathHash(d: string): string {
    const normalized = this.normalizePathData(d);
    return this.simpleHash(normalized);
  }

  /**
   * Gets the shape type from tag name
   */
  private getShape(tag: string): SvgFingerprint['shape'] {
    const shapes: SvgFingerprint['shape'][] = [
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
      'svg',
    ];
    return shapes.find((s) => s === tag) ?? 'path';
  }

  /**
   * Normalizes path data for consistent hashing
   */
  private normalizePathData(d: string): string {
    // Split into commands, take first 5 for fingerprint
    const commands = d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) ?? [];
    const firstN = commands.slice(0, 5);

    // Normalize: trim, round numbers to 1 decimal
    return firstN
      .map((cmd) => {
        return cmd.trim().replace(/(-?\d+\.?\d*)/g, (match) => {
          return parseFloat(match).toFixed(1);
        });
      })
      .join(' ');
  }

  /**
   * Computes geometry hash for non-path shapes
   */
  private computeGeomHash(element: SVGElement, shape: string): string {
    const attrs: string[] = [];

    switch (shape) {
      case 'circle':
        // Use radius ratio for scale independence
        attrs.push(`r=${element.getAttribute('r') ?? '0'}`);
        break;

      case 'rect':
        // Use aspect ratio for scale independence
        {
          const w = parseFloat(element.getAttribute('width') ?? '0');
          const h = parseFloat(element.getAttribute('height') ?? '0');
          if (w > 0 && h > 0) {
            attrs.push(`ratio=${(w / h).toFixed(2)}`);
          }
        }
        break;

      case 'ellipse':
        // Use radii ratio
        {
          const rx = parseFloat(element.getAttribute('rx') ?? '0');
          const ry = parseFloat(element.getAttribute('ry') ?? '0');
          if (rx > 0 && ry > 0) {
            attrs.push(`ratio=${(rx / ry).toFixed(2)}`);
          }
        }
        break;

      case 'line':
        // Use angle/direction
        {
          const x1 = parseFloat(element.getAttribute('x1') ?? '0');
          const y1 = parseFloat(element.getAttribute('y1') ?? '0');
          const x2 = parseFloat(element.getAttribute('x2') ?? '0');
          const y2 = parseFloat(element.getAttribute('y2') ?? '0');
          const angle = Math.atan2(y2 - y1, x2 - x1);
          attrs.push(`angle=${angle.toFixed(2)}`);
        }
        break;
    }

    return this.simpleHash(attrs.join(';'));
  }

  /**
   * Detects animations on SVG element
   */
  hasAnimation(element: SVGElement): boolean {
    // Check for SMIL animation elements
    if (element.querySelector('animate, animateTransform, animateMotion')) {
      return true;
    }

    // Check for CSS animations
    const doc = element.ownerDocument;
    if (doc?.defaultView) {
      try {
        const style = doc.defaultView.getComputedStyle(element);
        if (
          style.animationName !== 'none' ||
          (style.transitionProperty !== 'all' &&
            style.transitionProperty !== 'none')
        ) {
          return true;
        }
      } catch {
        // getComputedStyle may fail in some contexts
      }
    }

    return false;
  }

  /**
   * Simple hash function for fingerprinting (not cryptographic)
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
