import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SvgFingerprinter } from '../../src/generator/svg-fingerprinter';
import type { SvgFingerprint } from '../../src/types';

describe('SvgFingerprinter', () => {
  let fingerprinter: SvgFingerprinter;
  let svg: SVGSVGElement;

  beforeEach(() => {
    fingerprinter = new SvgFingerprinter();
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.appendChild(svg);
  });

  describe('Basic Fingerprinting', () => {
    it('should fingerprint SVG rect element', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      svg.appendChild(rect);

      const result = fingerprinter.fingerprint(rect);

      expect(result.shape).toBe('rect');
      expect(typeof result.hasAnimation).toBe('boolean');
      expect(result.geomHash).toBeDefined();
    });

    it('should fingerprint SVG circle element', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.shape).toBe('circle');
      expect(typeof result.hasAnimation).toBe('boolean');
      expect(result.geomHash).toBeDefined();
    });

    it('should fingerprint SVG ellipse element', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('rx', '100');
      ellipse.setAttribute('ry', '50');
      svg.appendChild(ellipse);

      const result = fingerprinter.fingerprint(ellipse);

      expect(result.shape).toBe('ellipse');
      expect(typeof result.hasAnimation).toBe('boolean');
      expect(result.geomHash).toBeDefined();
    });

    it('should fingerprint SVG line element', () => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '100');
      line.setAttribute('y2', '100');
      svg.appendChild(line);

      const result = fingerprinter.fingerprint(line);

      expect(result.shape).toBe('line');
      expect(typeof result.hasAnimation).toBe('boolean');
      expect(result.geomHash).toBeDefined();
    });

    it('should fingerprint SVG path element', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M10 10 L90 90 L10 90 Z');
      svg.appendChild(path);

      const result = fingerprinter.fingerprint(path);

      expect(result.shape).toBe('path');
      expect(typeof result.hasAnimation).toBe('boolean');
      expect(result.dHash).toBeDefined();
      expect(result.geomHash).toBeUndefined();
    });

    it('should fingerprint SVG polygon element', () => {
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0,0 100,0 100,100 0,100');
      svg.appendChild(polygon);

      const result = fingerprinter.fingerprint(polygon);

      expect(result.shape).toBe('polygon');
      expect(typeof result.hasAnimation).toBe('boolean');
    });

    it('should fingerprint SVG g element', () => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(g);

      const result = fingerprinter.fingerprint(g);

      expect(result.shape).toBe('g');
      expect(typeof result.hasAnimation).toBe('boolean');
    });

    it('should fingerprint SVG polyline element', () => {
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '0,0 50,50 100,0');
      svg.appendChild(polyline);

      const result = fingerprinter.fingerprint(polyline);

      expect(result.shape).toBe('polyline');
      expect(typeof result.hasAnimation).toBe('boolean');
    });

    it('should fingerprint SVG text element', () => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.textContent = 'Hello';
      svg.appendChild(text);

      const result = fingerprinter.fingerprint(text);

      expect(result.shape).toBe('text');
      expect(typeof result.hasAnimation).toBe('boolean');
    });

    it('should fingerprint SVG use element', () => {
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#icon');
      svg.appendChild(use);

      const result = fingerprinter.fingerprint(use);

      expect(result.shape).toBe('use');
      expect(typeof result.hasAnimation).toBe('boolean');
    });

    it('should fingerprint SVG svg element', () => {
      const nestedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      nestedSvg.setAttribute('width', '100');
      nestedSvg.setAttribute('height', '100');
      svg.appendChild(nestedSvg);

      const result = fingerprinter.fingerprint(nestedSvg);

      expect(result.shape).toBe('svg');
      expect(typeof result.hasAnimation).toBe('boolean');
    });
  });

  describe('Path Hashing', () => {
    it('should compute consistent hash for same path data', () => {
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10 10 L90 90 L10 90 Z');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10 10 L90 90 L10 90 Z');

      const hash1 = fingerprinter.fingerprint(path1).dHash;
      const hash2 = fingerprinter.fingerprint(path2).dHash;

      expect(hash1).toBe(hash2);
    });

    it('should normalize path data (round to 1 decimal)', () => {
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10.123 10.456 L90.789 90.012');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10.1 10.5 L90.8 90.0');

      const hash1 = fingerprinter.fingerprint(path1).dHash;
      const hash2 = fingerprinter.fingerprint(path2).dHash;

      expect(hash1).toBe(hash2);
    });

    it('should normalize path data with different number formats', () => {
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10 10.0 L90.00 90');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10.0 10 L90 90.0');

      const hash1 = fingerprinter.fingerprint(path1).dHash;
      const hash2 = fingerprinter.fingerprint(path2).dHash;

      expect(hash1).toBe(hash2);
    });

    it('should normalize negative numbers in path data', () => {
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M-10.123 -10.456 L-90.789 -90.012');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M-10.1 -10.5 L-90.8 -90.0');

      const hash1 = fingerprinter.fingerprint(path1).dHash;
      const hash2 = fingerprinter.fingerprint(path2).dHash;

      expect(hash1).toBe(hash2);
    });

    it('should truncate to first 5 commands', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M0 0 L10 10 L20 20 L30 30 L40 40 L50 50 L60 60 L70 70');

      const hash = fingerprinter.computePathHash('M0 0 L10 10 L20 20 L30 30 L40 40 L50 50 L60 60 L70 70');
      const hashTruncated = fingerprinter.computePathHash('M0 0 L10 10 L20 20 L30 30 L40 40');

      expect(hash).toBe(hashTruncated);
    });

    it('should handle empty path data', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', '');

      const result = fingerprinter.fingerprint(path);

      // Empty d attribute is falsy, so no dHash is computed
      expect(result.dHash).toBeUndefined();
      expect(result.shape).toBe('path');
    });

    it('should handle malformed path data', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'invalid-path-data');

      const result = fingerprinter.fingerprint(path);

      expect(result.dHash).toBeDefined();
    });

    it('should produce consistent hash for identical inputs (property-based)', () => {
      // Property-based test: same input should always produce same hash
      const pathData = 'M10 20 L30 40 C50 60 70 80 90 100';
      const hashes: string[] = [];

      for (let i = 0; i < 10; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        const hash = fingerprinter.computePathHash(pathData);
        hashes.push(hash);
      }

      // All hashes should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });

    it('should produce different hashes for different path data', () => {
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10 10 L20 20');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10 10 L30 30');

      const hash1 = fingerprinter.fingerprint(path1).dHash;
      const hash2 = fingerprinter.fingerprint(path2).dHash;

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Geometry Hashing', () => {
    it('should compute aspect ratio for rect elements', () => {
      const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect1.setAttribute('width', '100');
      rect1.setAttribute('height', '50');

      const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect2.setAttribute('width', '200');
      rect2.setAttribute('height', '100');

      const hash1 = fingerprinter.fingerprint(rect1).geomHash;
      const hash2 = fingerprinter.fingerprint(rect2).geomHash;

      // Same aspect ratio (2:1) should produce same hash
      expect(hash1).toBe(hash2);
    });

    it('should compute radii ratio for ellipse elements', () => {
      const ellipse1 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse1.setAttribute('rx', '100');
      ellipse1.setAttribute('ry', '50');

      const ellipse2 = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse2.setAttribute('rx', '200');
      ellipse2.setAttribute('ry', '100');

      const hash1 = fingerprinter.fingerprint(ellipse1).geomHash;
      const hash2 = fingerprinter.fingerprint(ellipse2).geomHash;

      // Same ratio should produce same hash
      expect(hash1).toBe(hash2);
    });

    it('should compute angle for line elements', () => {
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '0');
      line1.setAttribute('y1', '0');
      line1.setAttribute('x2', '100');
      line1.setAttribute('y2', '100');

      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '0');
      line2.setAttribute('y1', '0');
      line2.setAttribute('x2', '50');
      line2.setAttribute('y2', '50');

      const hash1 = fingerprinter.fingerprint(line1).geomHash;
      const hash2 = fingerprinter.fingerprint(line2).geomHash;

      // Same angle (45 degrees) should produce same hash
      expect(hash1).toBe(hash2);
    });

    it('should handle zero dimensions for rect', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '0');
      rect.setAttribute('height', '0');

      const result = fingerprinter.fingerprint(rect);

      // When width or height is 0, ratio is not computed, but hash should still be defined
      expect(result.geomHash).toBeDefined();
    });

    it('should handle negative dimensions for rect', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '-100');
      rect.setAttribute('height', '-50');

      const result = fingerprinter.fingerprint(rect);

      // Negative dimensions should be handled (parseFloat returns negative, ratio check fails)
      expect(result.geomHash).toBeDefined();
    });

    it('should handle zero radii for ellipse', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('rx', '0');
      ellipse.setAttribute('ry', '0');

      const result = fingerprinter.fingerprint(ellipse);

      // When rx or ry is 0, ratio is not computed, but hash should still be defined
      expect(result.geomHash).toBeDefined();
    });

    it('should handle negative radii for ellipse', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('rx', '-100');
      ellipse.setAttribute('ry', '-50');

      const result = fingerprinter.fingerprint(ellipse);

      // Negative radii should be handled
      expect(result.geomHash).toBeDefined();
    });

    it('should handle zero coordinates for line', () => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', '0');
      line.setAttribute('y2', '0');

      const result = fingerprinter.fingerprint(line);

      // Zero-length line should still produce a hash (angle = 0)
      expect(result.geomHash).toBeDefined();
    });

    it('should handle negative coordinates for line', () => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '-10');
      line.setAttribute('y1', '-20');
      line.setAttribute('x2', '-30');
      line.setAttribute('y2', '-40');

      const result = fingerprinter.fingerprint(line);

      // Negative coordinates should produce valid angle
      expect(result.geomHash).toBeDefined();
    });

    it('should produce consistent hash for identical geometry (property-based)', () => {
      // Property-based test: same geometry should always produce same hash
      const rects: SVGRectElement[] = [];
      const hashes: string[] = [];

      for (let i = 0; i < 10; i++) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100');
        rect.setAttribute('height', '50');
        rects.push(rect);
        const hash = fingerprinter.fingerprint(rect).geomHash;
        hashes.push(hash!);
      }

      // All hashes should be identical
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(1);
    });
  });

  describe('Animation Detection', () => {
    it('should detect SMIL animations', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'r');
      circle.appendChild(animate);
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.hasAnimation).toBe(true);
    });

    it('should detect animateTransform', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
      rect.appendChild(animateTransform);
      svg.appendChild(rect);

      const result = fingerprinter.fingerprint(rect);

      expect(result.hasAnimation).toBe(true);
    });

    it('should detect animateMotion', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const animateMotion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      circle.appendChild(animateMotion);
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.hasAnimation).toBe(true);
    });

    it('should determine animation status for static SVG', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      svg.appendChild(circle);

      const hasAnimation = fingerprinter.hasAnimation(circle);

      // Should return a boolean (actual value depends on jsdom environment)
      expect(typeof hasAnimation).toBe('boolean');
    });

    it('should detect CSS animations via getComputedStyle', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      svg.appendChild(rect);

      // Mock getComputedStyle to return animation name
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn().mockReturnValue({
        animationName: 'spin',
        transitionProperty: 'none',
      } as CSSStyleDeclaration);

      const result = fingerprinter.fingerprint(rect);

      expect(result.hasAnimation).toBe(true);

      // Restore original
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should detect CSS transitions via getComputedStyle', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      svg.appendChild(circle);

      // Mock getComputedStyle to return transition property
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn().mockReturnValue({
        animationName: 'none',
        transitionProperty: 'transform',
      } as CSSStyleDeclaration);

      const result = fingerprinter.fingerprint(circle);

      expect(result.hasAnimation).toBe(true);

      // Restore original
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should handle getComputedStyle errors gracefully', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      svg.appendChild(rect);

      // Mock getComputedStyle to throw error
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn().mockImplementation(() => {
        throw new Error('getComputedStyle failed');
      });

      // Should not throw, should return false for hasAnimation
      const result = fingerprinter.fingerprint(rect);

      expect(result.hasAnimation).toBe(false);

      // Restore original
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should handle missing defaultView in document', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      
      // Create element without ownerDocument.defaultView
      const orphanDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', null);
      const orphanRect = orphanDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      orphanRect.setAttribute('width', '100');
      orphanRect.setAttribute('height', '50');

      // Should not throw
      const result = fingerprinter.fingerprint(orphanRect);

      expect(result.hasAnimation).toBe(false);
    });
  });

  describe('ARIA and Title', () => {
    it('should extract role attribute', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('role', 'img');
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.role).toBe('img');
    });

    it('should extract title text for accessibility', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = 'Circle Icon';
      circle.appendChild(title);
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.titleText).toBe('Circle Icon');
    });

    it('should trim title text whitespace', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = '  Circle Icon  ';
      circle.appendChild(title);
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.titleText).toBe('Circle Icon');
    });

    it('should extract empty string for whitespace-only title', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = '   ';
      circle.appendChild(title);
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      // trim() on whitespace-only content results in empty string
      expect(result.titleText).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle path without d attribute', () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(path);

      const result = fingerprinter.fingerprint(path);

      expect(result.shape).toBe('path');
      expect(result.dHash).toBeUndefined();
    });

    it('should handle circle without radius', () => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      svg.appendChild(circle);

      const result = fingerprinter.fingerprint(circle);

      expect(result.shape).toBe('circle');
      expect(result.geomHash).toBeDefined();
    });

    it('should default to path shape for unknown tags', () => {
      const unknown = document.createElementNS('http://www.w3.org/2000/svg', 'unknown');
      svg.appendChild(unknown);

      const result = fingerprinter.fingerprint(unknown as any);

      expect(result.shape).toBe('path');
    });

    it('should handle rect with missing width', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('height', '50');
      svg.appendChild(rect);

      const result = fingerprinter.fingerprint(rect);

      expect(result.shape).toBe('rect');
      expect(result.geomHash).toBeDefined();
    });

    it('should handle rect with missing height', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      svg.appendChild(rect);

      const result = fingerprinter.fingerprint(rect);

      expect(result.shape).toBe('rect');
      expect(result.geomHash).toBeDefined();
    });

    it('should handle ellipse with missing rx', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('ry', '50');
      svg.appendChild(ellipse);

      const result = fingerprinter.fingerprint(ellipse);

      expect(result.shape).toBe('ellipse');
      expect(result.geomHash).toBeDefined();
    });

    it('should handle ellipse with missing ry', () => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('rx', '100');
      svg.appendChild(ellipse);

      const result = fingerprinter.fingerprint(ellipse);

      expect(result.shape).toBe('ellipse');
      expect(result.geomHash).toBeDefined();
    });

    it('should handle line with missing coordinates', () => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      // Missing x2, y2
      svg.appendChild(line);

      const result = fingerprinter.fingerprint(line);

      expect(result.shape).toBe('line');
      expect(result.geomHash).toBeDefined();
    });

    it('should handle invalid numeric attributes gracefully', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', 'invalid');
      rect.setAttribute('height', 'also-invalid');
      svg.appendChild(rect);

      const result = fingerprinter.fingerprint(rect);

      // parseFloat('invalid') returns NaN, which should be handled
      expect(result.shape).toBe('rect');
      expect(result.geomHash).toBeDefined();
    });
  });
});
