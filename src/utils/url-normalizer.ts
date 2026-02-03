/**
 * URL normalization utilities for consistent URL comparison in EID resolution.
 * Handles relative/absolute URL conversion for same-origin matching.
 */

/**
 * Normalizes URL to a consistent form for comparison, prioritizing relative URLs for stability.
 *
 * **Normalization Strategy:**
 * - **Relative URLs**: Returned as-is (already normalized)
 * - **Same-origin absolute URLs**: Converted to relative (pathname + search + hash)
 * - **Cross-origin absolute URLs**: Preserved as absolute (identity attribute)
 * - **Special protocols** (`javascript:`, `mailto:`, `tel:`): Preserved as-is
 * - **Protocol-relative URLs** (`//cdn.example.com`): Preserved as-is
 * - **Invalid URLs**: Returned as-is for graceful degradation (exact match fallback)
 *
 * **Use Case:**
 * Solves rrweb iframe replay scenarios where relative URLs during recording
 * become absolute URLs during replay (e.g., `/path` → `https://example.com/path`).
 *
 * @param url - The URL to normalize (should be pre-cleaned via cleanAttributeValue)
 * @param documentUrl - Optional document base URL (defaults to window.location.href)
 * @returns Normalized URL for comparison
 *
 * @example
 * // Same-origin: absolute → relative
 * normalizeUrlForComparison('https://example.com/path', 'https://example.com')
 * // Returns: '/path'
 *
 * @example
 * // Relative: no-op
 * normalizeUrlForComparison('/path#section', 'https://example.com')
 * // Returns: '/path#section'
 *
 * @example
 * // Cross-origin: preserved
 * normalizeUrlForComparison('https://external.com/api', 'https://example.com')
 * // Returns: 'https://external.com/api'
 *
 * @example
 * // Special protocol: preserved
 * normalizeUrlForComparison('javascript:void(0)', 'https://example.com')
 * // Returns: 'javascript:void(0)'
 */
export function normalizeUrlForComparison(url: string, documentUrl?: string): string {
  // Handle empty/null URLs
  if (!url) return url;

  // Detect document base URL (explicit param > window.location > none)
  const baseUrl = getDocumentBaseUrl(documentUrl);

  try {
    // Already relative: return as-is
    if (isRelativeUrl(url)) {
      return url;
    }

    // Protocol-relative URLs (//cdn.example.com/script.js)
    if (url.startsWith('//')) {
      return url;
    }

    // Special protocols: javascript:, mailto:, tel:, data:, blob:
    if (isSpecialProtocol(url)) {
      return url;
    }

    // Parse URL (throws for invalid URLs)
    const parsed = new URL(url, baseUrl);

    // If no base URL available, we can't determine same-origin
    // Return as-is (keeps absolute URL for cross-origin detection later)
    if (!baseUrl) {
      return url;
    }

    const base = new URL(baseUrl);

    // Same origin: convert to relative (pathname + search + hash)
    if (parsed.origin === base.origin) {
      // Construct relative URL from parsed components
      let relative = parsed.pathname;

      // Append search (query) if present
      if (parsed.search) {
        relative += parsed.search;
      }

      // Append hash (fragment) if present
      if (parsed.hash) {
        relative += parsed.hash;
      }

      return relative;
    }

    // Cross-origin: preserve absolute URL
    // Already cleaned by cleanAttributeValue (query/hash removed if dynamic)
    return url;
  } catch {
    // Invalid URL format - return as-is for exact match fallback
    // Examples: "not a url", malformed URIs
    return url;
  }
}

/**
 * Checks if a URL is relative (doesn't start with protocol)
 * @param url - URL to check
 * @returns True if relative, false otherwise
 */
function isRelativeUrl(url: string): boolean {
  // Relative URLs don't start with http://, https://, or //
  return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('//');
}

/**
 * Checks if a URL uses a special protocol that should be preserved
 * @param url - URL to check
 * @returns True if special protocol, false otherwise
 */
function isSpecialProtocol(url: string): boolean {
  const specialProtocols = ['javascript:', 'mailto:', 'tel:', 'data:', 'blob:', 'file:'];
  return specialProtocols.some((protocol) => url.startsWith(protocol));
}

/**
 * Gets the document base URL for same-origin detection
 * Priority: explicit parameter > window.location > undefined
 * @param documentUrl - Optional explicit base URL
 * @returns Base URL or undefined
 */
function getDocumentBaseUrl(documentUrl?: string): string | undefined {
  // Explicit parameter (highest priority)
  if (documentUrl) {
    return documentUrl;
  }

  // Browser environment: use window.location.href
  if (typeof window !== 'undefined' && window.location && window.location.href) {
    return window.location.href;
  }

  // SSR/test environment: no base URL available
  return undefined;
}
