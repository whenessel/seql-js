import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { normalizeUrlForComparison } from '../../src/utils/url-normalizer';

describe('normalizeUrlForComparison', () => {
  // Store original window.location for restoration
  let originalLocation: Location | undefined;

  beforeEach(() => {
    // Save original window.location if it exists
    if (typeof window !== 'undefined') {
      originalLocation = window.location;
    }
  });

  afterEach(() => {
    // Restore original window.location
    if (originalLocation && typeof window !== 'undefined') {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    }
  });

  describe('Empty and invalid URLs', () => {
    it('should return empty string for empty input', () => {
      expect(normalizeUrlForComparison('')).toBe('');
    });

    it('should return null for null input', () => {
      expect(normalizeUrlForComparison(null as unknown as string)).toBe(null);
    });

    it('should return undefined for undefined input', () => {
      expect(normalizeUrlForComparison(undefined as unknown as string)).toBe(undefined);
    });

    it('should return invalid URL as-is (graceful degradation)', () => {
      expect(normalizeUrlForComparison('not a url')).toBe('not a url');
      expect(normalizeUrlForComparison('just some text')).toBe('just some text');
      expect(normalizeUrlForComparison('://invalid')).toBe('://invalid');
    });
  });

  describe('Relative URLs (no-op)', () => {
    it('should return relative path as-is', () => {
      expect(normalizeUrlForComparison('/path')).toBe('/path');
      expect(normalizeUrlForComparison('/path/to/page')).toBe('/path/to/page');
    });

    it('should return relative path with query as-is', () => {
      expect(normalizeUrlForComparison('/path?query=value')).toBe('/path?query=value');
    });

    it('should return relative path with hash as-is', () => {
      expect(normalizeUrlForComparison('/path#section')).toBe('/path#section');
    });

    it('should return relative path with query and hash as-is', () => {
      expect(normalizeUrlForComparison('/path?query=value#section')).toBe(
        '/path?query=value#section'
      );
    });

    it('should return fragment-only URLs as-is', () => {
      expect(normalizeUrlForComparison('#section')).toBe('#section');
      expect(normalizeUrlForComparison('#')).toBe('#');
    });

    it('should return query-only URLs as-is', () => {
      expect(normalizeUrlForComparison('?query=value')).toBe('?query=value');
    });
  });

  describe('Same-origin absolute URLs (convert to relative)', () => {
    const baseUrl = 'https://example.com';

    it('should convert simple same-origin URL to relative', () => {
      expect(normalizeUrlForComparison('https://example.com/path', baseUrl)).toBe('/path');
    });

    it('should convert same-origin URL with query to relative', () => {
      expect(normalizeUrlForComparison('https://example.com/path?query=value', baseUrl)).toBe(
        '/path?query=value'
      );
    });

    it('should convert same-origin URL with hash to relative', () => {
      expect(normalizeUrlForComparison('https://example.com/path#section', baseUrl)).toBe(
        '/path#section'
      );
    });

    it('should convert same-origin URL with query and hash to relative', () => {
      expect(
        normalizeUrlForComparison('https://example.com/path?query=value#section', baseUrl)
      ).toBe('/path?query=value#section');
    });

    it('should convert root path URL to /', () => {
      expect(normalizeUrlForComparison('https://example.com/', baseUrl)).toBe('/');
      expect(normalizeUrlForComparison('https://example.com', baseUrl)).toBe('/');
    });

    it('should handle nested paths', () => {
      expect(normalizeUrlForComparison('https://example.com/a/b/c', baseUrl)).toBe('/a/b/c');
    });

    it('should preserve special characters in path', () => {
      expect(normalizeUrlForComparison('https://example.com/path%20with%20spaces', baseUrl)).toBe(
        '/path%20with%20spaces'
      );
    });

    it('should handle same-origin with different protocol (http vs https)', () => {
      // Different protocol = different origin
      expect(normalizeUrlForComparison('http://example.com/path', baseUrl)).toBe(
        'http://example.com/path'
      );
    });

    it('should handle same-origin with port', () => {
      expect(
        normalizeUrlForComparison('https://example.com:443/path', 'https://example.com:443')
      ).toBe('/path');
    });

    it('should handle same-origin with different port as different origin', () => {
      expect(
        normalizeUrlForComparison('https://example.com:8080/path', 'https://example.com:443')
      ).toBe('https://example.com:8080/path');
    });
  });

  describe('Cross-origin absolute URLs (preserve)', () => {
    const baseUrl = 'https://example.com';

    it('should preserve cross-origin URL', () => {
      expect(normalizeUrlForComparison('https://external.com/path', baseUrl)).toBe(
        'https://external.com/path'
      );
    });

    it('should preserve cross-origin URL with query', () => {
      expect(normalizeUrlForComparison('https://external.com/path?query=value', baseUrl)).toBe(
        'https://external.com/path?query=value'
      );
    });

    it('should preserve cross-origin URL with hash', () => {
      expect(normalizeUrlForComparison('https://external.com/path#section', baseUrl)).toBe(
        'https://external.com/path#section'
      );
    });

    it('should preserve subdomain as cross-origin', () => {
      expect(normalizeUrlForComparison('https://subdomain.example.com/path', baseUrl)).toBe(
        'https://subdomain.example.com/path'
      );
    });

    it('should preserve different TLD as cross-origin', () => {
      expect(normalizeUrlForComparison('https://example.org/path', baseUrl)).toBe(
        'https://example.org/path'
      );
    });
  });

  describe('Protocol-relative URLs', () => {
    it('should preserve protocol-relative URL as-is', () => {
      expect(normalizeUrlForComparison('//cdn.example.com/script.js')).toBe(
        '//cdn.example.com/script.js'
      );
    });

    it('should preserve protocol-relative URL with query', () => {
      expect(normalizeUrlForComparison('//cdn.example.com/script.js?v=1')).toBe(
        '//cdn.example.com/script.js?v=1'
      );
    });

    it('should not confuse // with protocol-relative when in middle of URL', () => {
      // This should be treated as relative path
      expect(normalizeUrlForComparison('path//to//file')).toBe('path//to//file');
    });
  });

  describe('Special protocols', () => {
    it('should preserve javascript: URLs', () => {
      expect(normalizeUrlForComparison('javascript:void(0)')).toBe('javascript:void(0)');
      expect(normalizeUrlForComparison('javascript:alert("test")')).toBe(
        'javascript:alert("test")'
      );
    });

    it('should preserve mailto: URLs', () => {
      expect(normalizeUrlForComparison('mailto:user@example.com')).toBe('mailto:user@example.com');
      expect(normalizeUrlForComparison('mailto:user@example.com?subject=Test')).toBe(
        'mailto:user@example.com?subject=Test'
      );
    });

    it('should preserve tel: URLs', () => {
      expect(normalizeUrlForComparison('tel:+1234567890')).toBe('tel:+1234567890');
    });

    it('should preserve data: URLs', () => {
      expect(normalizeUrlForComparison('data:text/plain;base64,SGVsbG8=')).toBe(
        'data:text/plain;base64,SGVsbG8='
      );
    });

    it('should preserve blob: URLs', () => {
      expect(normalizeUrlForComparison('blob:https://example.com/uuid')).toBe(
        'blob:https://example.com/uuid'
      );
    });

    it('should preserve file: URLs', () => {
      expect(normalizeUrlForComparison('file:///path/to/file.txt')).toBe(
        'file:///path/to/file.txt'
      );
    });
  });

  describe('Base URL detection', () => {
    it('should use explicit documentUrl parameter', () => {
      expect(normalizeUrlForComparison('https://example.com/path', 'https://example.com')).toBe(
        '/path'
      );
    });

    it('should fall back to window.location if available', () => {
      if (typeof window !== 'undefined') {
        // Mock window.location
        Object.defineProperty(window, 'location', {
          value: {
            href: 'https://example.com',
            origin: 'https://example.com',
          },
          writable: true,
          configurable: true,
        });

        expect(normalizeUrlForComparison('https://example.com/path')).toBe('/path');
      }
    });

    it('should preserve absolute URL when no base URL available (SSR)', () => {
      // In SSR environment (no window), absolute URLs should be preserved
      expect(normalizeUrlForComparison('https://example.com/path')).toBe(
        'https://example.com/path'
      );
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle rrweb iframe replay scenario', () => {
      // Recording: relative URL
      const recorded = '/modern-seaside-stay/booking';

      // Replay: absolute URL in iframe
      const replayed = 'https://appsurify.github.io/modern-seaside-stay/booking';

      // Both should normalize to the same relative URL
      expect(normalizeUrlForComparison(recorded, 'https://appsurify.github.io')).toBe(recorded);
      expect(normalizeUrlForComparison(replayed, 'https://appsurify.github.io')).toBe(recorded);
    });

    it('should handle SPA navigation with pushState', () => {
      const baseUrl = 'https://app.example.com';

      expect(normalizeUrlForComparison('https://app.example.com/dashboard', baseUrl)).toBe(
        '/dashboard'
      );
      expect(normalizeUrlForComparison('/dashboard', baseUrl)).toBe('/dashboard');
    });

    it('should handle CDN assets', () => {
      const baseUrl = 'https://example.com';

      // CDN is cross-origin - should be preserved
      expect(normalizeUrlForComparison('https://cdn.example.com/assets/style.css', baseUrl)).toBe(
        'https://cdn.example.com/assets/style.css'
      );
    });

    it('should handle multi-origin iframes', () => {
      // Parent: example.com, iframe: embedded.com
      const parentUrl = 'https://example.com';
      const iframeUrl = 'https://embedded.com/widget';

      // iframe URL is cross-origin from parent
      expect(normalizeUrlForComparison(iframeUrl, parentUrl)).toBe(iframeUrl);
    });
  });

  describe('Edge cases', () => {
    it('should handle trailing slashes consistently', () => {
      const baseUrl = 'https://example.com';

      expect(normalizeUrlForComparison('https://example.com/path/', baseUrl)).toBe('/path/');
      expect(normalizeUrlForComparison('https://example.com/path', baseUrl)).toBe('/path');
    });

    it('should handle URL with only fragment', () => {
      const baseUrl = 'https://example.com';

      expect(normalizeUrlForComparison('https://example.com#section', baseUrl)).toBe('/#section');
    });

    it('should handle URL with only query', () => {
      const baseUrl = 'https://example.com';

      expect(normalizeUrlForComparison('https://example.com?query=value', baseUrl)).toBe(
        '/?query=value'
      );
    });

    it('should handle encoded characters', () => {
      const baseUrl = 'https://example.com';

      expect(normalizeUrlForComparison('https://example.com/path%20with%20spaces', baseUrl)).toBe(
        '/path%20with%20spaces'
      );
    });

    it('should handle international domain names', () => {
      const baseUrl = 'https://例え.jp';

      expect(normalizeUrlForComparison('https://例え.jp/path', baseUrl)).toBe('/path');
    });
  });
});
