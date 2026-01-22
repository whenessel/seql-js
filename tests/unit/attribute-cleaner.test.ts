import { describe, it, expect } from 'vitest';
import { cleanAttributeValue } from '../../src/utils/attribute-cleaner';

describe('AttributeCleaner', () => {
  describe('cleanAttributeValue', () => {
    describe('href attribute', () => {
      it('should clean relative URLs by removing query parameters', () => {
        expect(cleanAttributeValue('href', '/page?session=123')).toBe('/page');
        expect(cleanAttributeValue('href', '/product?id=1&category=2')).toBe('/product');
        expect(cleanAttributeValue('href', '/about?utm_source=test')).toBe('/about');
      });

      it('should preserve hash for relative URLs if not dynamic', () => {
        expect(cleanAttributeValue('href', '/page#section')).toBe('/page#section');
        expect(cleanAttributeValue('href', '/page#top')).toBe('/page#top');
      });

      it('should remove dynamic hash from relative URLs', () => {
        expect(cleanAttributeValue('href', '/page#12345678')).toBe('/page');
        expect(cleanAttributeValue('href', '/page#abc12345')).toBe('/page');
        expect(cleanAttributeValue('href', '/page#session123')).toBe('/page');
        expect(cleanAttributeValue('href', '/page#temp456')).toBe('/page');
      });

      it('should preserve query parameters for absolute URLs', () => {
        expect(cleanAttributeValue('href', 'https://example.com/page?id=1')).toBe(
          'https://example.com/page?id=1'
        );
        expect(cleanAttributeValue('href', 'http://example.com/page?session=123')).toBe(
          'http://example.com/page?session=123'
        );
      });

      it('should remove dynamic hash from absolute URLs', () => {
        expect(cleanAttributeValue('href', 'https://example.com/page#12345678')).toBe(
          'https://example.com/page'
        );
        expect(cleanAttributeValue('href', 'https://example.com/page#session123')).toBe(
          'https://example.com/page'
        );
      });

      it('should preserve non-dynamic hash in absolute URLs', () => {
        expect(cleanAttributeValue('href', 'https://example.com/page#section')).toBe(
          'https://example.com/page#section'
        );
      });

      it('should handle complex URLs with both query and hash', () => {
        expect(cleanAttributeValue('href', '/page?id=1#section')).toBe('/page#section');
        expect(cleanAttributeValue('href', '/page?id=1#12345678')).toBe('/page');
        expect(cleanAttributeValue('href', 'https://example.com/page?id=1#section')).toBe(
          'https://example.com/page?id=1#section'
        );
      });
    });

    describe('src attribute', () => {
      it('should clean relative URLs by removing query parameters', () => {
        expect(cleanAttributeValue('src', '/image.jpg?version=123')).toBe('/image.jpg');
        expect(cleanAttributeValue('src', '/script.js?cache=456')).toBe('/script.js');
      });

      it('should preserve query parameters for absolute URLs', () => {
        expect(cleanAttributeValue('src', 'https://example.com/image.jpg?v=1')).toBe(
          'https://example.com/image.jpg?v=1'
        );
      });

      it('should remove dynamic hash', () => {
        expect(cleanAttributeValue('src', '/image.jpg#12345678')).toBe('/image.jpg');
        expect(cleanAttributeValue('src', 'https://example.com/image.jpg#abc12345')).toBe(
          'https://example.com/image.jpg'
        );
      });
    });

    describe('other attributes', () => {
      it('should return value as-is for non-URL attributes', () => {
        expect(cleanAttributeValue('name', 'username')).toBe('username');
        expect(cleanAttributeValue('type', 'text')).toBe('text');
        expect(cleanAttributeValue('aria-label', 'Submit button')).toBe('Submit button');
        expect(cleanAttributeValue('data-testid', 'submit-btn')).toBe('submit-btn');
      });
    });

    describe('edge cases', () => {
      it('should handle empty strings', () => {
        expect(cleanAttributeValue('href', '')).toBe('');
        expect(cleanAttributeValue('src', '')).toBe('');
      });

      it('should handle URLs without query or hash', () => {
        expect(cleanAttributeValue('href', '/page')).toBe('/page');
        expect(cleanAttributeValue('href', 'https://example.com')).toBe('https://example.com');
      });

      it('should handle only query string', () => {
        expect(cleanAttributeValue('href', '/page?param=value')).toBe('/page');
      });

      it('should handle only hash', () => {
        expect(cleanAttributeValue('href', '/page#section')).toBe('/page#section');
        expect(cleanAttributeValue('href', '/page#12345678')).toBe('/page');
      });

      it('should handle UUID-like hashes', () => {
        expect(cleanAttributeValue('href', '/page#550e8400-e29b-41d4-a716-446655440000')).toBe(
          '/page'
        );
      });

      it('should handle timestamp-like hashes', () => {
        expect(cleanAttributeValue('href', '/page#1234567890')).toBe('/page');
      });
    });

    describe('options', () => {
      it('should respect preserveQueryForAbsolute option', () => {
        expect(
          cleanAttributeValue('href', 'https://example.com/page?id=1', {
            preserveQueryForAbsolute: false,
          })
        ).toBe('https://example.com/page');
      });

      it('should respect removeDynamicHashes option', () => {
        expect(
          cleanAttributeValue('href', '/page#12345678', {
            removeDynamicHashes: false,
          })
        ).toBe('/page#12345678');
      });
    });
  });
});
