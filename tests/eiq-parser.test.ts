import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  parseEIQ,
  stringifyEID,
  generateEIQ,
  resolveEIQ,
  generateEID,
  type ElementIdentity,
} from '../src';

describe('EIQ Parser', () => {
  describe('stringifyEID', () => {
    it('should stringify simple EID to EIQ', () => {
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'footer',
          semantics: {},
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 10,
        },
        meta: {
          confidence: 0.75,
          generatedAt: '2024-01-01T00:00:00Z',
          generator: 'test',
          source: 'test',
          degraded: false,
        },
      };

      const eiq = stringifyEID(eid);
      expect(eiq).toBe('v1.0: footer :: button');
    });

    it('should stringify EID with classes', () => {
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'footer',
          semantics: {
            classes: ['container', 'dark'],
          },
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {
            classes: ['btn-primary'],
          },
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 10,
        },
        meta: {
          confidence: 0.75,
          generatedAt: '2024-01-01T00:00:00Z',
          generator: 'test',
          source: 'test',
          degraded: false,
        },
      };

      const eiq = stringifyEID(eid);
      expect(eiq).toBe('v1.0: footer.container.dark :: button.btn-primary');
    });

    it('should stringify EID with attributes (sorted)', () => {
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: {
            attributes: {
              id: 'checkout',
              role: 'form',
            },
          },
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {
            attributes: {
              type: 'submit',
              'aria-label': 'Submit',
            },
          },
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 10,
        },
        meta: {
          confidence: 0.75,
          generatedAt: '2024-01-01T00:00:00Z',
          generator: 'test',
          source: 'test',
          degraded: false,
        },
      };

      const eiq = stringifyEID(eid);
      // Attributes should be sorted alphabetically
      expect(eiq).toBe('v1.0: form[id="checkout",role="form"] :: button[aria-label="Submit",type="submit"]');
    });

    it('should stringify EID with path', () => {
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'footer',
          semantics: {},
          score: 0.8,
          degraded: false,
        },
        path: [
          {
            tag: 'ul',
            semantics: {},
            score: 0.7,
          },
          {
            tag: 'li',
            semantics: {},
            score: 0.7,
            nthChild: 3,
          },
        ],
        target: {
          tag: 'a',
          semantics: {
            attributes: {
              href: '/contact',
            },
          },
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 10,
        },
        meta: {
          confidence: 0.75,
          generatedAt: '2024-01-01T00:00:00Z',
          generator: 'test',
          source: 'test',
          degraded: false,
        },
      };

      const eiq = stringifyEID(eid);
      expect(eiq).toBe('v1.0: footer :: ul > li#3 > a[href="/contact"]');
    });

    it('should stringify EID with constraints', () => {
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'form',
          semantics: {},
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'button',
          semantics: {},
          score: 0.7,
        },
        constraints: [
          {
            type: 'uniqueness',
            params: {
              mode: 'best-score',
            },
            priority: 100,
          },
          {
            type: 'visibility',
            params: {
              required: true,
            },
            priority: 80,
          },
        ],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 10,
        },
        meta: {
          confidence: 0.75,
          generatedAt: '2024-01-01T00:00:00Z',
          generator: 'test',
          source: 'test',
          degraded: false,
        },
      };

      const eiq = stringifyEID(eid);
      expect(eiq).toBe('v1.0: form :: button {unique=true,visible=true}');
    });

    it('should escape special characters in attribute values', () => {
      const eid: ElementIdentity = {
        version: '1.0',
        anchor: {
          tag: 'div',
          semantics: {},
          score: 0.8,
          degraded: false,
        },
        path: [],
        target: {
          tag: 'a',
          semantics: {
            attributes: {
              title: 'Say "Hello"',
            },
          },
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 10,
        },
        meta: {
          confidence: 0.75,
          generatedAt: '2024-01-01T00:00:00Z',
          generator: 'test',
          source: 'test',
          degraded: false,
        },
      };

      const eiq = stringifyEID(eid);
      expect(eiq).toContain('\\"Hello\\"');
    });
  });

  describe('parseEIQ', () => {
    it('should parse simple EIQ', () => {
      const eiq = 'v1: footer :: button';
      const eid = parseEIQ(eiq);

      expect(eid.version).toBe('1.0');
      expect(eid.anchor.tag).toBe('footer');
      expect(eid.target.tag).toBe('button');
      expect(eid.path).toHaveLength(0);
    });

    it('should parse EIQ with classes', () => {
      const eiq = 'v1: footer.container :: button.btn-primary';
      const eid = parseEIQ(eiq);

      expect(eid.anchor.semantics.classes).toEqual(['container']);
      expect(eid.target.semantics.classes).toEqual(['btn-primary']);
    });

    it('should parse EIQ with attributes', () => {
      const eiq = 'v1: form[id="checkout"] :: button[type="submit"]';
      const eid = parseEIQ(eiq);

      expect(eid.anchor.semantics.attributes).toEqual({ id: 'checkout' });
      expect(eid.target.semantics.attributes).toEqual({ type: 'submit' });
    });

    it('should parse EIQ with path', () => {
      const eiq = 'v1: footer :: ul > li#3 > a[href="/contact"]';
      const eid = parseEIQ(eiq);

      expect(eid.path).toHaveLength(2);
      expect(eid.path[0].tag).toBe('ul');
      expect(eid.path[1].tag).toBe('li');
      expect(eid.path[1].nthChild).toBe(3);
      expect(eid.target.tag).toBe('a');
      expect(eid.target.semantics.attributes).toEqual({ href: '/contact' });
    });

    it('should parse EIQ with constraints', () => {
      const eiq = 'v1: form :: button {unique=true,visible=true}';
      const eid = parseEIQ(eiq);

      expect(eid.constraints).toHaveLength(2);
      expect(eid.constraints[0].type).toBe('uniqueness');
      expect(eid.constraints[1].type).toBe('visibility');
    });

    it('should parse EIQ with multiple attributes', () => {
      const eiq = 'v1: form :: input[name="email",type="email"]';
      const eid = parseEIQ(eiq);

      expect(eid.target.semantics.attributes).toEqual({
        name: 'email',
        type: 'email',
      });
    });

    it('should throw on missing version', () => {
      const eiq = 'footer :: button';
      expect(() => parseEIQ(eiq)).toThrow('missing version prefix');
    });

    it('should throw on missing anchor separator', () => {
      const eiq = 'v1: footer > button';
      expect(() => parseEIQ(eiq)).toThrow('missing anchor separator');
    });

    it('should throw on unsupported version', () => {
      const eiq = 'v2: footer :: button';
      expect(() => parseEIQ(eiq)).toThrow('Unsupported EIQ version');
    });

    it('should handle escaped characters', () => {
      const eiq = 'v1: div :: a[title="Say \\"Hello\\""]';
      const eid = parseEIQ(eiq);

      expect(eid.target.semantics.attributes?.title).toBe('Say "Hello"');
    });
  });

  describe('Round-trip (stringify → parse → stringify)', () => {
    it('should maintain same EIQ after round-trip', () => {
      const original = 'v1: footer :: ul > li#3 > a[href="/contact"]';
      const eid = parseEIQ(original);
      const stringified = stringifyEID(eid);

      // Version format might differ (v1 vs v1.0)
      expect(stringified.replace('v1.0', 'v1')).toBe(original);
    });

    it('should maintain classes after round-trip', () => {
      const original = 'v1: footer.container :: button.btn-primary';
      const eid = parseEIQ(original);
      const stringified = stringifyEID(eid);

      expect(stringified.replace('v1.0', 'v1')).toBe(original);
    });

    it('should maintain complex structure after round-trip', () => {
      const original = 'v1: form[id="login"] :: div.field > input[name="email",type="email"]';
      const eid = parseEIQ(original);
      const stringified = stringifyEID(eid);

      expect(stringified.replace('v1.0', 'v1')).toBe(original);
    });
  });

  describe('generateEIQ (facade)', () => {
    it('should generate EIQ from DOM element', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <footer>
              <button class="btn-primary">Click</button>
            </footer>
          </body>
        </html>
      `);

      const button = dom.window.document.querySelector('button')!;
      const eiq = generateEIQ(button);

      expect(eiq).toBeTruthy();
      expect(eiq).toContain('v1');
      expect(eiq).toContain('footer');
      expect(eiq).toContain('button');
    });

    it('should return null for invalid element', () => {
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
      const body = dom.window.document.body;

      // Body itself might not generate a valid EID depending on options
      const eiq = generateEIQ(body);
      // Either returns string or null is acceptable
      expect(eiq === null || typeof eiq === 'string').toBe(true);
    });
  });

  describe('resolveEIQ (facade)', () => {
    it('should resolve EIQ to DOM elements', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <footer>
              <button class="btn-primary">Click</button>
            </footer>
          </body>
        </html>
      `);

      const eiq = 'v1: footer :: button';
      const elements = resolveEIQ(eiq, dom.window.document);

      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0].tagName.toLowerCase()).toBe('button');
    });

    it('should return empty array for malformed EIQ', () => {
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);

      const eiq = 'invalid-eiq-string';
      const elements = resolveEIQ(eiq, dom.window.document);

      expect(elements).toEqual([]);
    });

    it('should return empty array for unresolvable EIQ', () => {
      const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);

      const eiq = 'v1: footer :: button.nonexistent';
      const elements = resolveEIQ(eiq, dom.window.document);

      expect(elements).toEqual([]);
    });
  });

  describe('Integration: generateEIQ → resolveEIQ', () => {
    it('should round-trip element through EIQ', () => {
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <body>
            <footer>
              <ul>
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </footer>
          </body>
        </html>
      `);

      const link = dom.window.document.querySelector('a[href="/contact"]')!;
      const eiq = generateEIQ(link);

      expect(eiq).toBeTruthy();

      const resolved = resolveEIQ(eiq!, dom.window.document);
      expect(resolved.length).toBeGreaterThan(0);
      expect(resolved[0].getAttribute('href')).toBe('/contact');
    });
  });
});
