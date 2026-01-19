import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  filterClasses,
  isUtilityClass,
  validateEID,
} from '../../src/utils';
import type { ElementIdentity } from '../../src/types';

describe('utils', () => {
  describe('normalizeText', () => {
    it('should trim and collapse whitespace', () => {
      expect(normalizeText('  hello   world  ')).toBe('hello world');
      expect(normalizeText('hello\n\tworld')).toBe('hello world');
      expect(normalizeText('   multiple   spaces   here   ')).toBe(
        'multiple spaces here',
      );
    });

    it('should handle empty and null values', () => {
      expect(normalizeText('')).toBe('');
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
    });
  });

  describe('filterClasses', () => {
    it('should separate semantic and utility classes', () => {
      // Utility pattern matches: prefix followed by - or :
      const classes = ['btn', 'card-header', 'mt-4', 'p-2', 'text-center'];
      const result = filterClasses(classes);

      expect(result.semantic).toContain('btn');
      expect(result.semantic).toContain('card-header');
      expect(result.utility).toContain('mt-4');
      expect(result.utility).toContain('p-2');
      expect(result.utility).toContain('text-center');
    });

    it('should filter out dynamic classes as utility', () => {
      const classes = [
        'nav-item',
        'css-abc123',
        'jss123',
        'button-primary',
        'sc-bdVaJa-0',
      ];
      const result = filterClasses(classes);

      expect(result.semantic).toEqual(['nav-item', 'button-primary']);
      expect(result.utility).toContain('css-abc123');
      expect(result.utility).toContain('jss123');
      expect(result.utility).toContain('sc-bdVaJa-0');
    });

    it('should detect utility class patterns', () => {
      // Pattern: prefix followed by - or :
      expect(isUtilityClass('mt-4')).toBe(true);
      expect(isUtilityClass('p-2')).toBe(true);
      expect(isUtilityClass('text-lg')).toBe(true);
      expect(isUtilityClass('bg-red')).toBe(true);
      expect(isUtilityClass('sm:block')).toBe(true);
      expect(isUtilityClass('hover:bg-blue')).toBe(true);

      // Animation classes
      expect(isUtilityClass('animate-spin')).toBe(true);
      expect(isUtilityClass('transition-all')).toBe(true);

      // Dynamic classes should also be detected as utility
      expect(isUtilityClass('css-abc123')).toBe(true);
      expect(isUtilityClass('jss123')).toBe(true);

      // Semantic classes (no utility prefix pattern)
      expect(isUtilityClass('card-header')).toBe(false);
      expect(isUtilityClass('nav-item')).toBe(false);
      expect(isUtilityClass('login-form')).toBe(false);
      expect(isUtilityClass('button-submit')).toBe(false);
    });
  });

  describe('validateEID', () => {
    it('should validate correct DSL structure', () => {
      const validDsl: ElementIdentity = {
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
          semantics: { classes: ['submit'] },
          score: 0.7,
        },
        constraints: [],
        fallback: {
          onMultiple: 'best-score',
          onMissing: 'anchor-only',
          maxDepth: 3,
        },
        meta: {
          confidence: 0.75,
          generatedAt: new Date().toISOString(),
          generator: 'dom-dsl@1.0',
          source: 'test',
          degraded: false,
        },
      };

      const result = validateEID(validDsl);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidDsl = {
        version: '1.0',
        anchor: null,
        path: [],
        target: { tag: 'button', semantics: {}, score: 0.5 },
      } as unknown as ElementIdentity;

      const result = validateEID(invalidDsl);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
