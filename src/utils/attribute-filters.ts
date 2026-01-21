/**
 * Attribute filtering for stable element identification
 * Separates stable identity attributes from temporary state attributes
 *
 * PHILOSOPHY: SEQL selectors identify elements by their semantic identity,
 * not their current state. An element is the same whether it's active/inactive,
 * visible/hidden, expanded/collapsed.
 */

/**
 * ARIA attributes that represent stable element identity/semantics
 */
export const ARIA_STABLE_ATTRIBUTES = [
  'role',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-level',
  'aria-posinset',
  'aria-setsize',
  'aria-haspopup',
] as const;

/**
 * ARIA attributes that represent temporary element state
 */
export const ARIA_STATE_ATTRIBUTES = [
  'aria-selected',
  'aria-checked',
  'aria-pressed',
  'aria-expanded',
  'aria-hidden',
  'aria-disabled',
  'aria-current',
  'aria-busy',
  'aria-invalid',
  'aria-grabbed',
  'aria-live',
  'aria-atomic',
] as const;

/**
 * data-* attributes representing temporary state
 */
export const DATA_STATE_ATTRIBUTES = [
  'data-state',
  'data-active',
  'data-inactive',
  'data-selected',
  'data-open',
  'data-closed',
  'data-visible',
  'data-hidden',
  'data-disabled',
  'data-enabled',
  'data-loading',
  'data-error',
  'data-success',
  'data-highlighted',
  'data-focused',
  'data-hover',
  'data-orientation',
  'data-theme',
] as const;

/**
 * Library-specific data-* prefixes to exclude
 */
export const LIBRARY_DATA_PREFIXES = [
  'data-radix-',
  'data-headlessui-',
  'data-reach-',
  'data-mui-',
  'data-chakra-',
  'data-mantine-',
  'data-tw-',
] as const;

/**
 * data-* patterns that represent stable IDs
 */
export const DATA_ID_PATTERNS = [
  'data-testid',
  'data-test-id',
  'data-test',
  'data-cy',
  'data-qa',
  'data-automation-id',
  'data-id',
  'data-component',
  'data-entity-id',
  'data-product-id',
  'data-user-id',
] as const;

/**
 * Standard HTML attributes that are stable
 */
export const HTML_STABLE_ATTRIBUTES = [
  'id',
  'name',
  'type',
  'placeholder',
  'title',
  'for',
  'alt',
  'href',
] as const;

/**
 * Standard HTML attributes that represent state
 */
export const HTML_STATE_ATTRIBUTES = [
  'disabled',
  'checked',
  'selected',
  'hidden',
  'readonly',
  'required',
  'value',
] as const;

/**
 * Patterns for generated IDs that should be excluded
 */
export const GENERATED_ID_PATTERNS = [
  /^radix-/,
  /^headlessui-/,
  /^mui-/,
  /:\w+:/,  // matches :ru:, :r1:, etc.
] as const;

/**
 * Determines if an attribute represents stable element identity
 * @param name - attribute name
 * @param value - attribute value
 * @returns true if attribute should be included in SEQL selector
 */
export function isStableAttribute(name: string, value: string): boolean {
  // Whitelist stable ARIA attributes
  if (ARIA_STABLE_ATTRIBUTES.includes(name as any)) return true;

  // Blacklist ARIA state attributes
  if (ARIA_STATE_ATTRIBUTES.includes(name as any)) return false;

  // Blacklist data-* state attributes
  if (DATA_STATE_ATTRIBUTES.includes(name as any)) return false;

  // Blacklist library-specific data-* prefixes
  if (LIBRARY_DATA_PREFIXES.some(prefix => name.startsWith(prefix))) {
    return false;
  }

  // Whitelist data-* ID patterns (exact match)
  if (DATA_ID_PATTERNS.includes(name as any)) return true;

  // Whitelist data-* ending with -id
  if (name.startsWith('data-') && name.endsWith('-id')) return true;

  // Filter generated IDs by pattern
  if (name === 'id') {
    if (GENERATED_ID_PATTERNS.some(pattern => pattern.test(value))) {
      return false;
    }
    return true;
  }

  // Whitelist stable HTML attributes
  if (HTML_STABLE_ATTRIBUTES.includes(name as any)) return true;

  // Blacklist HTML state attributes
  if (HTML_STATE_ATTRIBUTES.includes(name as any)) return false;

  // Allow other data-* attributes by default (blacklist approach)
  if (name.startsWith('data-')) return true;

  // Reject unknown attributes
  return false;
}
