import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator/generator';
import { resolve } from '../../src/resolver/resolver';
import { CssGenerator } from '../../src/resolver/css-generator';

describe('Root Elements - Integration Tests (Round-trip)', () => {
  let cssGenerator: CssGenerator;

  beforeEach(() => {
    cssGenerator = new CssGenerator();

    // Clear head for clean test environment
    while (document.head.firstChild) {
      document.head.removeChild(document.head.firstChild);
    }
  });

  describe('Round-trip: html element', () => {
    it('should complete round-trip for html element', () => {
      const html = document.documentElement;

      // Generate EID
      const eid = generateEID(html);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(html);
    });
  });

  describe('Round-trip: head element', () => {
    it('should complete round-trip for head element', () => {
      const head = document.head;

      // Generate EID
      const eid = generateEID(head);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(head);
    });
  });

  describe('Round-trip: body element', () => {
    it('should complete round-trip for body element', () => {
      const body = document.body;

      // Generate EID
      const eid = generateEID(body);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(body);
    });
  });

  describe('Round-trip: meta with unique name', () => {
    it('should complete round-trip for meta with unique name attribute', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      meta.setAttribute('content', 'Test page description');
      document.head.appendChild(meta);

      // Generate EID
      const eid = generateEID(meta);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(meta);
    });
  });

  describe('Round-trip: meta without name (nth-child)', () => {
    it('should complete round-trip for meta elements using nth-child', () => {
      const meta1 = document.createElement('meta');
      meta1.setAttribute('charset', 'utf-8');
      document.head.appendChild(meta1);

      const meta2 = document.createElement('meta');
      meta2.setAttribute('http-equiv', 'X-UA-Compatible');
      meta2.setAttribute('content', 'IE=edge');
      document.head.appendChild(meta2);

      // Generate EID for second meta
      const eid = generateEID(meta2);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBeGreaterThan(0);

      // Should find the correct meta (may need disambiguation)
      expect(results.elements).toContain(meta2);
    });
  });

  describe('Round-trip: title element', () => {
    it('should complete round-trip for title element', () => {
      const title = document.createElement('title');
      title.textContent = 'Test Page Title';
      document.head.appendChild(title);

      // Generate EID
      const eid = generateEID(title);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(title);
    });
  });

  describe('Round-trip: link element', () => {
    it('should complete round-trip for link element with href', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', '/styles.css');
      document.head.appendChild(link);

      // Generate EID
      const eid = generateEID(link);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(link);
    });
  });

  describe('Round-trip: script in head', () => {
    it('should complete round-trip for script element', () => {
      const script = document.createElement('script');
      script.setAttribute('src', '/app.js');
      script.setAttribute('type', 'module');
      document.head.appendChild(script);

      // Generate EID
      const eid = generateEID(script);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(script);
    });
  });

  describe('Complex head structure', () => {
    it('should handle multiple meta elements with correct disambiguation', () => {
      // Create a realistic head structure
      const charset = document.createElement('meta');
      charset.setAttribute('charset', 'utf-8');
      document.head.appendChild(charset);

      const viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      viewport.setAttribute('content', 'width=device-width, initial-scale=1');
      document.head.appendChild(viewport);

      const description = document.createElement('meta');
      description.setAttribute('name', 'description');
      description.setAttribute('content', 'Page description');
      document.head.appendChild(description);

      const keywords = document.createElement('meta');
      keywords.setAttribute('name', 'keywords');
      keywords.setAttribute('content', 'test, keywords');
      document.head.appendChild(keywords);

      const title = document.createElement('title');
      title.textContent = 'Test Page';
      document.head.appendChild(title);

      const stylesheet = document.createElement('link');
      stylesheet.setAttribute('rel', 'stylesheet');
      stylesheet.setAttribute('href', '/main.css');
      document.head.appendChild(stylesheet);

      // Test each element round-trip
      const elements = [charset, viewport, description, keywords, title, stylesheet];

      for (const element of elements) {
        const eid = generateEID(element);
        expect(eid).not.toBeNull();

        const results = resolve(eid!, document);
        expect(results).not.toBeNull();
        expect(results.elements).toContain(element);
      }
    });
  });

  describe('Nested elements in head', () => {
    it('should handle nested style element with content', () => {
      const style = document.createElement('style');
      style.textContent = 'body { margin: 0; }';
      document.head.appendChild(style);

      // Generate EID
      const eid = generateEID(style);
      expect(eid).not.toBeNull();

      // Resolve back
      const results = resolve(eid!, document);
      expect(results).not.toBeNull();
      expect(results.elements.length).toBe(1);
      expect(results.elements[0]).toBe(style);
    });
  });
});
