import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';
import { resolve } from '../../src/resolver/resolver';

describe('SVG Elements - Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Round-Trip: Generation and Resolution', () => {
    it('should generate and resolve SVG path element', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M10 10 L90 90 L10 90 Z');
      svg.appendChild(path);
      document.body.appendChild(svg);

      const eid = generateEID(path as any)!;

      expect(eid.target.semantics.svg).toBeDefined();
      expect(eid.target.semantics.svg?.shape).toBe('path');
      expect(eid.target.semantics.svg?.dHash).toBeDefined();

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(path);
    });

    it('should generate and resolve SVG rect element', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '50');
      svg.appendChild(rect);
      document.body.appendChild(svg);

      const eid = generateEID(rect as any)!;

      expect(eid.target.semantics.svg).toBeDefined();
      expect(eid.target.semantics.svg?.shape).toBe('rect');
      expect(eid.target.semantics.svg?.geomHash).toBeDefined();

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(rect);
    });

    it('should generate and resolve animated SVG', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'r');
      circle.appendChild(animate);
      svg.appendChild(circle);
      document.body.appendChild(svg);

      const eid = generateEID(circle as any)!;

      expect(eid.target.semantics.svg?.hasAnimation).toBe(true);

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(circle);
    });

    it('should generate and resolve nested SVG', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const nestedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      nestedSvg.setAttribute('width', '100');
      nestedSvg.setAttribute('height', '100');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M10 10 L90 90');
      nestedSvg.appendChild(path);
      svg.appendChild(nestedSvg);
      document.body.appendChild(svg);

      const eid = generateEID(path as any)!;

      expect(eid.target.semantics.svg?.shape).toBe('path');

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(path);
    });
  });

  describe('Real Icon Libraries', () => {
    it('should handle Lucide-style icon structure', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M12 2L2 7l10 5 10-5-10-5z');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M2 17l10 5 10-5M2 12l10 5 10-5');
      svg.appendChild(path1);
      svg.appendChild(path2);
      document.body.appendChild(svg);

      const eid = generateEID(svg as any)!;

      expect(eid.target.semantics.svg).toBeDefined();
      expect(eid.target.semantics.svg?.shape).toBe('svg');

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should handle Font Awesome SVG icon structure', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 512 512');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        'M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248z'
      );
      svg.appendChild(path);
      document.body.appendChild(svg);

      const eid = generateEID(path as any)!;

      expect(eid.target.semantics.svg?.shape).toBe('path');
      expect(eid.target.semantics.svg?.dHash).toBeDefined();

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should handle Material Design Icons structure', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
      );
      svg.appendChild(path);
      document.body.appendChild(svg);

      const eid = generateEID(path as any)!;

      expect(eid.target.semantics.svg?.shape).toBe('path');

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });
  });

  describe('Complex SVG Structures', () => {
    it('should distinguish similar icons with different paths', () => {
      const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10 10 L20 20');
      svg1.appendChild(path1);
      document.body.appendChild(svg1);

      const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10 10 L30 30');
      svg2.appendChild(path2);
      document.body.appendChild(svg2);

      const eid1 = generateEID(path1 as any)!;
      const eid2 = generateEID(path2 as any)!;

      // Different paths should produce different dHash
      expect(eid1.target.semantics.svg?.dHash).not.toBe(eid2.target.semantics.svg?.dHash);

      const result1 = resolve(eid1, document);
      const result2 = resolve(eid2, document);

      expect(result1.status).toBe('success');
      expect(result2.status).toBe('success');
      expect(result1.elements[0]).toBe(path1);
      expect(result2.elements[0]).toBe(path2);
    });

    it('should handle SVG with multiple paths', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10 10 L20 20');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M30 30 L40 40');
      g.appendChild(path1);
      g.appendChild(path2);
      svg.appendChild(g);
      document.body.appendChild(svg);

      const eid = generateEID(path1 as any)!;

      expect(eid.target.semantics.svg?.shape).toBe('path');

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(path1);
    });

    it('should handle SVG with title for accessibility', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '50');
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = 'Circle Icon';
      circle.appendChild(title);
      svg.appendChild(circle);
      document.body.appendChild(svg);

      const eid = generateEID(circle as any)!;

      expect(eid.target.semantics.svg?.titleText).toBe('Circle Icon');

      const result = resolve(eid, document);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
    });

    it('should handle SVG in different contexts (same icon, different containers)', () => {
      const container1 = document.createElement('div');
      container1.id = 'icon-container-1';
      const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path1.setAttribute('d', 'M10 10 L20 20');
      svg1.appendChild(path1);
      container1.appendChild(svg1);
      document.body.appendChild(container1);

      const container2 = document.createElement('div');
      container2.id = 'icon-container-2';
      const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path2.setAttribute('d', 'M10 10 L20 20'); // Same path
      svg2.appendChild(path2);
      container2.appendChild(svg2);
      document.body.appendChild(container2);

      const eid = generateEID(path1 as any)!;

      // Should resolve to correct path based on anchor context
      const result = resolve(eid, container1);

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(path1);
    });
  });
});
