/**
 * Checks if an ID appears to be dynamically generated
 * Dynamic IDs should not be used in DSL as they change between sessions
 *
 * @param id - ID string to check
 * @returns True if ID appears to be dynamic/generated
 */
export function isDynamicId(id: string): boolean {
  // Pattern: prefix-number (e.g., "input-123", "react-select-2")
  if (/^[a-z]+-\d+$/i.test(id)) return true;

  // Pattern: multi-word-prefix-number (e.g., "react-day-picker-1", "mui-date-input-42")
  if (/^[a-z]+(-[a-z]+)+-\d+$/i.test(id)) return true;

  // Pattern: prefix_number (underscore variant, e.g., "radix_dialog_1")
  if (/^[a-z]+(_[a-z]+)*_\d+$/i.test(id)) return true;

  // Pattern: just numbers (e.g., "123")
  if (/^\d+$/.test(id)) return true;

  // Pattern: React-style IDs (e.g., ":r0:", ":R1:")
  if (/^:[a-z0-9]+:$/i.test(id)) return true;

  // Pattern: UUID-like (e.g., "550e8400-e29b-41d4-a716-446655440000")
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    return true;
  }

  // Pattern: hash-like (long random strings)
  // Case 1: Has mixed case AND digits (e.g., "scBdVaJa1", "css123AbC")
  // Case 2: Very long lowercase+digit sequences (20+ chars, e.g., "abc123def456ghi789jkl012mno345pqr678")
  // Does NOT match semantic camelCase without digits: "firstName", "lastName", "emailAddress"
  if (/^[a-z]{1,3}[A-Za-z0-9]{8,}$/.test(id)) {
    // Require BOTH digits AND uppercase for shorter IDs (9-19 chars)
    // OR just require 20+ chars for very long hash-like sequences
    const hasDigits = /\d/.test(id);
    const hasUppercase = /[A-Z]/.test(id);
    const isVeryLong = id.length >= 20;

    if ((hasDigits && hasUppercase) || isVeryLong) {
      return true;
    }
  }

  // Pattern: Radix UI style (e.g., "radix-:r0:")
  if (/^radix-/.test(id)) return true;

  // Pattern: MUI style (e.g., "mui-123456")
  if (/^mui-\d+$/.test(id)) return true;

  return false;
}

/**
 * Attributes whose values are references to IDs of other elements.
 * If the value contains a dynamic ID, the attribute should be ignored.
 */
export const ID_REFERENCE_ATTRIBUTES = new Set([
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-activedescendant',
  'for',
  'form',
  'list',
  'headers',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
]);

/**
 * Checks if an attribute value contains a dynamic ID reference.
 * Used for filtering attributes like aria-labelledby.
 * @param value - Attribute value (may contain space-separated IDs)
 * @returns True if value contains at least one dynamic ID
 */
export function hasDynamicIdReference(value: string): boolean {
  // Value may contain a list of IDs separated by spaces
  const ids = value.trim().split(/\s+/);
  return ids.some((id) => isDynamicId(id));
}

/**
 * Validates if an ID is stable and suitable for DSL
 * @param id - ID string to validate
 * @returns True if ID is stable and can be used in DSL
 */
export function isStableId(id: string | null | undefined): boolean {
  if (!id) return false;
  return !isDynamicId(id);
}
