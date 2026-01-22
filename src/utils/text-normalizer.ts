/**
 * Normalizes text for comparison
 * Following SPECIFICATION.md §11
 *
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Replaces newlines/tabs with spaces
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .trim()
    .replace(/[\n\t\r]/g, ' ')
    .replace(/\s+/g, ' ');
}
