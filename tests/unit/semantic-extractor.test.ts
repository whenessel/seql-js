import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticExtractor } from '../../src/generator/semantic-extractor';
import { createEIDCache } from '../../src/utils/eid-cache';
import type { GeneratorOptions } from '../../src/types';

describe('SemanticExtractor', () => {
  let extractor: SemanticExtractor;
  let options: GeneratorOptions;

  beforeEach(() => {
    document.body.innerHTML = '';
    options = {};
    extractor = new SemanticExtractor(options);
  });

  describe('extract', () => {
    it('should extract stable ID', () => {
      const button = document.createElement('button');
      button.id = 'submit-button';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.id).toBe('submit-button');
    });

    it('should not extract dynamic ID', () => {
      const button = document.createElement('button');
      button.id = 'abc123def456ghi789jkl012mno345pqr678';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.id).toBeUndefined();
    });

    it('should extract classes with utility filtering', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary mt-4 p-2';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.classes).toBeDefined();
      expect(semantics.classes).toContain('btn');
      expect(semantics.classes).toContain('btn-primary');
      // Utility classes should be filtered out
      expect(semantics.classes).not.toContain('mt-4');
      expect(semantics.classes).not.toContain('p-2');
    });

    it('should extract all classes when includeUtilityClasses is true', () => {
      const extractorWithUtils = new SemanticExtractor({ includeUtilityClasses: true });
      const button = document.createElement('button');
      button.className = 'btn btn-primary mt-4 p-2';
      document.body.appendChild(button);

      const semantics = extractorWithUtils.extract(button);

      expect(semantics.classes).toBeDefined();
      expect(semantics.classes).toContain('btn');
      expect(semantics.classes).toContain('btn-primary');
      expect(semantics.classes).toContain('mt-4');
      expect(semantics.classes).toContain('p-2');
    });

    it('should not extract classes when empty', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.classes).toBeUndefined();
    });

    it('should extract semantic attributes', () => {
      const link = document.createElement('a');
      link.setAttribute('href', '/login');
      link.setAttribute('data-testid', 'login-link');
      document.body.appendChild(link);

      const semantics = extractor.extract(link);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['href']).toBe('/login');
      expect(semantics.attributes!['data-testid']).toBe('login-link');
    });

    it('should extract role', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.role).toBe('button');
    });

    it('should extract text for button element', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.raw).toBe('Submit');
      expect(semantics.text!.normalized).toBe('Submit');
    });

    it('should not extract text for div element', () => {
      const div = document.createElement('div');
      div.textContent = 'Some text';
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.text).toBeUndefined();
    });

    it('should use cache when available', () => {
      const cache = createEIDCache();
      const extractorWithCache = new SemanticExtractor(options, cache);
      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);

      // First call - should compute
      const semantics1 = extractorWithCache.extract(button);
      expect(semantics1.id).toBe('test-button');

      // Second call - should use cache
      const semantics2 = extractorWithCache.extract(button);
      expect(semantics2).toEqual(semantics1);
    });

    it('should extract text for all text-extractable tags', () => {
      const tags = [
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
      ];

      tags.forEach((tag) => {
        const element = document.createElement(tag);
        element.textContent = 'Test text';
        document.body.appendChild(element);

        const semantics = extractor.extract(element);

        expect(semantics.text).toBeDefined();
        expect(semantics.text!.raw).toBe('Test text');
        document.body.removeChild(element);
      });
    });
  });

  describe('scoreElement', () => {
    it('should return base score (0.5) for element with no semantics', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const score = extractor.scoreElement(div);

      expect(score).toBe(0.5);
    });

    it('should add bonus for ID', () => {
      const button = document.createElement('button');
      button.id = 'submit-button';
      document.body.appendChild(button);

      const score = extractor.scoreElement(button);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeCloseTo(0.65, 2); // 0.5 + 0.15
    });

    it('should add bonus for classes', () => {
      const button = document.createElement('button');
      button.className = 'btn btn-primary';
      document.body.appendChild(button);

      const score = extractor.scoreElement(button);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeCloseTo(0.6, 2); // 0.5 + 0.1
    });

    it('should add bonus for attributes', () => {
      const link = document.createElement('a');
      link.setAttribute('href', '/login');
      document.body.appendChild(link);

      const score = extractor.scoreElement(link);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeCloseTo(0.6, 2); // 0.5 + 0.1
    });

    it('should add bonus for role', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      document.body.appendChild(div);

      const score = extractor.scoreElement(div);

      expect(score).toBeGreaterThan(0.5);
      // Base (0.5) + role (0.1) = 0.6, but might have other bonuses
      expect(score).toBeGreaterThanOrEqual(0.6);
    });

    it('should add bonus for text', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit';
      document.body.appendChild(button);

      const score = extractor.scoreElement(button);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeCloseTo(0.55, 2); // 0.5 + 0.05
    });

    it('should combine all bonuses', () => {
      const button = document.createElement('button');
      button.id = 'submit-button';
      button.className = 'btn btn-primary';
      button.setAttribute('data-testid', 'submit');
      button.setAttribute('role', 'button');
      button.textContent = 'Submit';
      document.body.appendChild(button);

      const score = extractor.scoreElement(button);

      expect(score).toBeGreaterThan(0.5);
      // Should cap at 1.0
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should cap score at 1.0', () => {
      const button = document.createElement('button');
      button.id = 'submit-button';
      button.className = 'btn btn-primary btn-large';
      button.setAttribute('href', '/submit');
      button.setAttribute('data-testid', 'submit');
      button.setAttribute('role', 'button');
      button.textContent = 'Submit Form Now';
      document.body.appendChild(button);

      const score = extractor.scoreElement(button);

      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('extractAttributes', () => {
    it('should skip ignored attributes (on*)', () => {
      const button = document.createElement('button');
      button.setAttribute('onclick', 'alert("test")');
      button.setAttribute('data-testid', 'button');
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['onclick']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('button');
    });

    it('should skip Angular attributes (ng-*)', () => {
      const div = document.createElement('div');
      div.setAttribute('ng-click', 'handleClick()');
      div.setAttribute('_ngcontent', 'abc123');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['ng-click']).toBeUndefined();
      expect(semantics.attributes!['_ngcontent']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should skip React attributes (data-react*)', () => {
      const div = document.createElement('div');
      div.setAttribute('data-reactid', 'abc123');
      div.setAttribute('data-react-root', 'true');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['data-reactid']).toBeUndefined();
      expect(semantics.attributes!['data-react-root']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should skip Vue attributes (data-v-*)', () => {
      const div = document.createElement('div');
      div.setAttribute('data-v-abc123', 'true');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['data-v-abc123']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should skip unstable attributes (aria-selected)', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-selected', 'true');
      button.setAttribute('data-testid', 'button');
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['aria-selected']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('button');
    });

    it('should skip ID-reference attributes with dynamic IDs', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-labelledby', 'abc123def456ghi789jkl012mno345pqr678');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['aria-labelledby']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should clean href/src values', () => {
      const link = document.createElement('a');
      link.setAttribute('href', '/login?ref=home#section');
      document.body.appendChild(link);

      const semantics = extractor.extract(link);

      expect(semantics.attributes).toBeDefined();
      // href should be cleaned (remove query, preserve non-dynamic hash)
      expect(semantics.attributes!['href']).toBe('/login#section');
    });

    it('should skip empty attribute values', () => {
      const div = document.createElement('div');
      div.setAttribute('data-testid', '');
      div.setAttribute('data-qa', '   ');
      div.setAttribute('href', '/valid');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['data-testid']).toBeUndefined();
      expect(semantics.attributes!['data-qa']).toBeUndefined();
      expect(semantics.attributes!['href']).toBe('/valid');
    });

    it('should skip dynamic values (long hashes)', () => {
      const div = document.createElement('div');
      // Use a hash that matches the pattern: 32+ hex characters (pattern: /^[a-f0-9]{32,}$/i)
      // Need exactly 32+ hex characters
      div.setAttribute(
        'data-id',
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
      );
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      // 32+ hex characters should be filtered as dynamic
      expect(semantics.attributes!['data-id']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should skip dynamic values (timestamps)', () => {
      const div = document.createElement('div');
      div.setAttribute('data-timestamp', '1234567890123');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['data-timestamp']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should skip dynamic values (JS artifacts)', () => {
      const div = document.createElement('div');
      div.setAttribute('data-value', 'undefined');
      div.setAttribute('data-obj', '[object Object]');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['data-value']).toBeUndefined();
      expect(semantics.attributes!['data-obj']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should skip dynamic values (template literals)', () => {
      const div = document.createElement('div');
      div.setAttribute('data-value', '{{variable}}');
      div.setAttribute('data-testid', 'div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeDefined();
      expect(semantics.attributes!['data-value']).toBeUndefined();
      expect(semantics.attributes!['data-testid']).toBe('div');
    });

    it('should prioritize attributes correctly', () => {
      const link = document.createElement('a');
      link.setAttribute('href', '/login');
      link.setAttribute('data-testid', 'login-link');
      link.setAttribute('aria-label', 'Login');
      document.body.appendChild(link);

      const semantics = extractor.extract(link);

      expect(semantics.attributes).toBeDefined();
      // All should be included (they have priority > 0)
      expect(semantics.attributes!['href']).toBe('/login');
      expect(semantics.attributes!['data-testid']).toBe('login-link');
      expect(semantics.attributes!['aria-label']).toBe('Login');
    });
  });

  describe('extractText', () => {
    it('should extract direct text content (TEXT_NODE)', () => {
      const button = document.createElement('button');
      const textNode = document.createTextNode('Submit');
      button.appendChild(textNode);
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.raw).toBe('Submit');
      expect(semantics.text!.normalized).toBe('Submit');
    });

    it('should fallback to textContent when no direct text nodes', () => {
      const button = document.createElement('button');
      const span = document.createElement('span');
      span.textContent = 'Submit';
      button.appendChild(span);
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      // Should use textContent fallback
      expect(semantics.text).toBeDefined();
    });

    it('should normalize text (trim, collapse whitespace)', () => {
      const button = document.createElement('button');
      button.textContent = '  Submit   Form  ';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.normalized).toBe('Submit Form');
    });

    it('should truncate text longer than 100 characters', () => {
      const button = document.createElement('button');
      const longText = 'a'.repeat(150);
      button.textContent = longText;
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.raw.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(semantics.text!.raw).toContain('...');
    });

    it('should return null for empty text', () => {
      const button = document.createElement('button');
      button.textContent = '';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeUndefined();
    });

    it('should return null for whitespace-only text', () => {
      const button = document.createElement('button');
      button.textContent = '   \n\t  ';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeUndefined();
    });

    it('should handle null textContent', () => {
      const button = document.createElement('button');
      Object.defineProperty(button, 'textContent', {
        get: () => null,
        configurable: true,
      });
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeUndefined();
    });

    it('should handle multiple text nodes', () => {
      const button = document.createElement('button');
      button.appendChild(document.createTextNode('Submit'));
      button.appendChild(document.createTextNode(' '));
      button.appendChild(document.createTextNode('Form'));
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.raw).toContain('Submit');
      expect(semantics.text!.raw).toContain('Form');
    });
  });

  describe('shouldExtractText', () => {
    it('should extract text for button', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
    });

    it('should extract text for anchor', () => {
      const link = document.createElement('a');
      link.textContent = 'Link';
      document.body.appendChild(link);

      const semantics = extractor.extract(link);

      expect(semantics.text).toBeDefined();
    });

    it('should extract text for headings', () => {
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
        const heading = document.createElement(tag);
        heading.textContent = 'Heading';
        document.body.appendChild(heading);

        const semantics = extractor.extract(heading);

        expect(semantics.text).toBeDefined();
        document.body.removeChild(heading);
      });
    });

    it('should not extract text for div', () => {
      const div = document.createElement('div');
      div.textContent = 'Some text';
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.text).toBeUndefined();
    });

    it('should not extract text for section', () => {
      const section = document.createElement('section');
      section.textContent = 'Some text';
      document.body.appendChild(section);

      const semantics = extractor.extract(section);

      expect(semantics.text).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle element without attributes', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const semantics = extractor.extract(div);

      expect(semantics.attributes).toBeUndefined();
    });

    it('should handle element with empty classes', () => {
      const button = document.createElement('button');
      button.className = '';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.classes).toBeUndefined();
    });

    it('should handle element with only utility classes', () => {
      const button = document.createElement('button');
      button.className = 'mt-4 p-2';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      // Utility classes should be filtered out
      expect(semantics.classes).toBeUndefined();
    });

    it('should handle very long text', () => {
      const button = document.createElement('button');
      button.textContent = 'a'.repeat(200);
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.raw.length).toBeLessThanOrEqual(103);
      expect(semantics.text!.normalized.length).toBeLessThanOrEqual(103);
    });

    it('should handle text with newlines and tabs', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit\n\tForm';
      document.body.appendChild(button);

      const semantics = extractor.extract(button);

      expect(semantics.text).toBeDefined();
      expect(semantics.text!.normalized).toBe('Submit Form');
    });
  });
});
