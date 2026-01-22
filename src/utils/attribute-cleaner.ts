/**
 * Attribute value cleaning for stable CSS selector generation
 * Cleans href/src attributes by removing dynamic query parameters and hashes
 */

/**
 * Options for cleaning attribute values
 */
export interface CleanAttributeOptions {
  /** Preserve query parameters for absolute URLs */
  preserveQueryForAbsolute?: boolean; // default: true
  /** Remove dynamic hashes */
  removeDynamicHashes?: boolean; // default: true
}

/**
 * Default options for cleaning
 */
const DEFAULT_OPTIONS: Required<CleanAttributeOptions> = {
  preserveQueryForAbsolute: true,
  removeDynamicHashes: true,
};

/**
 * Checks if a hash value is dynamic (should be removed)
 * @param hash - Hash string to check (without #)
 * @returns True if hash is dynamic
 */
function isDynamicHash(hash: string): boolean {
  if (!hash) return false;

  const dynamicPatterns = [
    /\d{5,}/, // 5+ digits
    /[a-f0-9]{8,}/i, // hex hash 8+ characters
    /(session|token|temp|random|timestamp|nonce|cache)/i, // dynamic words
    /^\d+$/, // only digits
    /^[a-f0-9-]{32,}$/i, // UUID-like
  ];

  return dynamicPatterns.some((p) => p.test(hash));
}

/**
 * Cleans URL value (href/src) by removing dynamic parts
 * @param value - URL value to clean
 * @param options - Cleaning options
 * @returns Cleaned URL value
 */
function cleanUrlValue(value: string, options: Required<CleanAttributeOptions>): string {
  if (!value) return value;

  const isAbsolute = value.startsWith('http://') || value.startsWith('https://');

  // Split into parts: base, query, hash
  const [baseWithQuery, hash] = value.split('#');
  const [base, query] = baseWithQuery.split('?');

  let cleaned = base;

  // Handle query parameters
  if (isAbsolute) {
    // For absolute URLs, preserve query if preserveQueryForAbsolute is true
    if (options.preserveQueryForAbsolute && query) {
      cleaned += `?${query}`;
    }
  }
  // For relative URLs, query is always removed (already handled by base)

  // Handle hash
  if (hash) {
    if (options.removeDynamicHashes && isDynamicHash(hash)) {
      // Remove dynamic hash
    } else {
      // Preserve non-dynamic hash
      cleaned += `#${hash}`;
    }
  }

  return cleaned;
}

/**
 * Cleans attribute value based on attribute name
 * Currently handles href and src attributes
 * @param attrName - Attribute name
 * @param value - Attribute value
 * @param options - Cleaning options
 * @returns Cleaned attribute value
 */
export function cleanAttributeValue(
  attrName: string,
  value: string,
  options: CleanAttributeOptions = {}
): string {
  if (!value) return value;

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Only clean href and src attributes
  if (attrName === 'href' || attrName === 'src') {
    return cleanUrlValue(value, opts);
  }

  // For other attributes, return as-is
  return value;
}
