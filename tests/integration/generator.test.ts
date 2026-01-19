import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';
import { AnchorFinder } from '../../src/generator/anchor-finder';

describe('generator', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Test');
  });

  describe('generateEID', () => {
    it('should generate DSL for a button inside a form', () => {
      const form = doc.createElement('form');
      form.id = 'login-form';
      const button = doc.createElement('button');
      button.className = 'submit-btn';
      button.textContent = 'Login';
      form.appendChild(button);
      doc.body.appendChild(form);

      const dsl = generateEID(button);

      expect(dsl).not.toBeNull();
      expect(dsl!.version).toBe('1.0');
      expect(dsl!.anchor.tag).toBe('form');
      expect(dsl!.anchor.semantics.id).toBe('login-form');
      expect(dsl!.target.tag).toBe('button');
      expect(dsl!.target.semantics.classes).toContain('submit-btn');
      expect(dsl!.meta.confidence).toBeGreaterThan(0);
    });

    it('should fallback to body when no semantic anchor found', () => {
      const div = doc.createElement('div');
      const span = doc.createElement('span');
      span.className = 'test-span';
      span.textContent = 'Hello';
      div.appendChild(span);
      doc.body.appendChild(div);

      // Lower confidence threshold to allow degraded DSL
      const dsl = generateEID(span, {
        fallbackToBody: true,
        confidenceThreshold: 0.1,
      });

      expect(dsl).not.toBeNull();
      expect(dsl!.anchor.tag).toBe('body');
      expect(dsl!.anchor.degraded).toBe(true);
      expect(dsl!.meta.degraded).toBe(true);
    });
  });

  describe('AnchorFinder', () => {
    it('should find semantic anchor with highest priority', () => {
      const nav = doc.createElement('nav');
      const section = doc.createElement('section');
      const button = doc.createElement('button');

      nav.appendChild(section);
      section.appendChild(button);
      doc.body.appendChild(nav);

      const finder = new AnchorFinder({ maxPathDepth: 10 });
      const result = finder.findAnchor(button);

      expect(result).not.toBeNull();
      // nav is Tier A, should be found first when traversing up
      expect(result!.element).toBe(section);
      expect(result!.tier).toBe('A');
    });

    it('should score anchors correctly', () => {
      const finder = new AnchorFinder({});

      const form = doc.createElement('form');
      form.setAttribute('aria-label', 'Login form');

      const div = doc.createElement('div');

      expect(finder.scoreAnchor(form)).toBeGreaterThan(finder.scoreAnchor(div));
    });
  });
});
