/**
 * Shared utilities for film title manipulation.
 * Used by both server-side scripts and client-side components.
 */

/**
 * Generate a URL-safe slug from a title.
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Clean title for matching/grouping purposes.
 * Removes pipe/bullet separators and parenthetical content.
 * e.g., "Film (ENG subs) | Event" -> "film"
 */
export function cleanTitle(title) {
  return title
    .split(/[|•]/)[0]
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/´/g, "'")
    .trim()
    .toLowerCase();
}

/**
 * Extract variant info from title (e.g., "50th Anniversary", "ENG SUBS").
 * Handles both "Film (variant)" and "Film (variant) | Event" formats.
 */
export function extractVariant(title) {
  // First strip any "| suffix" part
  const baseTitle = title.split(/[|•]/)[0].trim();
  const match = baseTitle.match(/\s*\(([^)]+)\)\s*$/);
  return match ? match[1] : null;
}

/**
 * Get clean title for display (remove variant suffix and event suffix).
 * e.g., "Film (ENG subs) | Event" -> "Film"
 */
export function getCleanDisplayTitle(title) {
  return title
    .split(/[|•]/)[0]
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}
