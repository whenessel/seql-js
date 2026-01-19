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

  // Pattern: just numbers (e.g., "123")
  if (/^\d+$/.test(id)) return true;

  // Pattern: React-style IDs (e.g., ":r0:", ":R1:")
  if (/^:[a-z0-9]+:$/i.test(id)) return true;

  // Pattern: UUID-like (e.g., "550e8400-e29b-41d4-a716-446655440000")
  if (
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
  ) {
    return true;
  }

  // Pattern: hash-like (long random strings with mixed case/numbers)
  // e.g., "css-1a2b3c4d", "sc-bdVaJa"
  if (
    /^[a-z]{1,3}[A-Za-z0-9]{8,}$/.test(id) &&
    (/\d/.test(id) || /[A-Z]/.test(id))
  ) {
    return true;
  }

  // Pattern: Radix UI style (e.g., "radix-:r0:")
  if (/^radix-/.test(id)) return true;

  // Pattern: MUI style (e.g., "mui-123456")
  if (/^mui-\d+$/.test(id)) return true;

  return false;
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
