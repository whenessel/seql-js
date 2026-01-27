import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator/generator';
import { CssGenerator } from '../../src/resolver/css-generator';

describe('Root Elements - Unit Tests', () => {
  let cssGenerator: CssGenerator;

  beforeEach(() => {
    cssGenerator = new CssGenerator();
  });

  describe('HTML element', () => {
    it('should generate valid EID for html element', () => {
      const html = document.documentElement;
      const eid = generateEID(html);

      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('html');
      expect(eid!.anchor.tag).toBe('html');
    });

    it('should generate CSS selector "html" for html element', () => {
      const html = document.documentElement;
      const eid = generateEID(html);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      expect(selector).toBe('html');
    });

    it('should resolve html element from EID', () => {
      const html = document.documentElement;
      const eid = generateEID(html);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      const resolved = document.querySelector(selector);

      expect(resolved).toBe(html);
    });

    it('should have confidence 1.0 for html element', () => {
      const html = document.documentElement;
      const eid = generateEID(html);

      expect(eid).not.toBeNull();
      expect(eid!.meta.confidence).toBe(1.0);
    });

    it('should not be degraded for html element', () => {
      const html = document.documentElement;
      const eid = generateEID(html);

      expect(eid).not.toBeNull();
      expect(eid!.meta.degraded).toBe(false);
    });
  });

  describe('HEAD element', () => {
    it('should generate valid EID for head element', () => {
      const head = document.head;
      const eid = generateEID(head);

      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('head');
      expect(eid!.anchor.tag).toBe('html');
    });

    it('should generate anchor as html for head element', () => {
      const head = document.head;
      const eid = generateEID(head);

      expect(eid).not.toBeNull();
      expect(eid!.anchor.tag).toBe('html');
    });

    it('should have empty path for head element', () => {
      const head = document.head;
      const eid = generateEID(head);

      expect(eid).not.toBeNull();
      expect(eid!.path).toEqual([]);
    });

    it('should generate CSS selector containing "html" and "head"', () => {
      const head = document.head;
      const eid = generateEID(head);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      expect(selector).toContain('html');
      expect(selector).toContain('head');
    });

    it('should resolve head element from EID', () => {
      const head = document.head;
      const eid = generateEID(head);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      const resolved = document.querySelector(selector);

      expect(resolved).toBe(head);
    });
  });

  describe('Elements in HEAD', () => {
    beforeEach(() => {
      // Clear head and add test elements
      while (document.head.firstChild) {
        document.head.removeChild(document.head.firstChild);
      }
    });

    it('should generate valid EID for meta element', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      meta.setAttribute('content', 'Test description');
      document.head.appendChild(meta);

      const eid = generateEID(meta);

      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('meta');
      expect(eid!.anchor.tag).toBe('html');
    });

    it('should include head in path for meta element', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);

      const eid = generateEID(meta);

      expect(eid).not.toBeNull();
      expect(eid!.path.length).toBeGreaterThan(0);
      expect(eid!.path[0].tag).toBe('head');
    });

    it('should generate valid CSS selector for meta element', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);

      const eid = generateEID(meta);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      expect(selector).toBeTruthy();
      expect(selector).toContain('html');
      expect(selector).toContain('head');
      expect(selector).toContain('meta');
    });

    it('should resolve meta element from CSS selector', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);

      const eid = generateEID(meta);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      const resolved = document.querySelector(selector);

      expect(resolved).toBe(meta);
    });

    it('should disambiguate between multiple meta elements', () => {
      const meta1 = document.createElement('meta');
      meta1.setAttribute('name', 'description');
      document.head.appendChild(meta1);

      const meta2 = document.createElement('meta');
      meta2.setAttribute('name', 'keywords');
      document.head.appendChild(meta2);

      const eid1 = generateEID(meta1);
      const eid2 = generateEID(meta2);

      expect(eid1).not.toBeNull();
      expect(eid2).not.toBeNull();

      const selector1 = cssGenerator.buildSelector(eid1!);
      const selector2 = cssGenerator.buildSelector(eid2!);

      expect(selector1).not.toBe(selector2);

      const resolved1 = document.querySelector(selector1);
      const resolved2 = document.querySelector(selector2);

      expect(resolved1).toBe(meta1);
      expect(resolved2).toBe(meta2);
    });

    it('should generate valid EID for title element', () => {
      const title = document.createElement('title');
      title.textContent = 'Test Title';
      document.head.appendChild(title);

      const eid = generateEID(title);

      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('title');
      expect(eid!.anchor.tag).toBe('html');

      const selector = cssGenerator.buildSelector(eid!);
      const resolved = document.querySelector(selector);
      expect(resolved).toBe(title);
    });

    it('should generate valid EID for link element', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', '/styles.css');
      document.head.appendChild(link);

      const eid = generateEID(link);

      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('link');
      expect(eid!.anchor.tag).toBe('html');

      const selector = cssGenerator.buildSelector(eid!);
      const resolved = document.querySelector(selector);
      expect(resolved).toBe(link);
    });
  });

  describe('BODY element', () => {
    it('should generate valid EID for body element', () => {
      const body = document.body;
      const eid = generateEID(body);

      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('body');
    });

    it('should use html as anchor for body element', () => {
      const body = document.body;
      const eid = generateEID(body);

      expect(eid).not.toBeNull();
      expect(eid!.anchor.tag).toBe('html');
    });

    it('should generate correct CSS selector for body', () => {
      const body = document.body;
      const eid = generateEID(body);

      expect(eid).not.toBeNull();
      const selector = cssGenerator.buildSelector(eid!);
      expect(selector).toContain('html');
      expect(selector).toContain('body');

      const resolved = document.querySelector(selector);
      expect(resolved).toBe(body);
    });
  });
});
