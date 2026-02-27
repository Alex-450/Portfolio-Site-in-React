/**
 * Shared utilities for film title manipulation.
 * Used by both server-side scripts and client-side components.
 */

/**
 * Generate a URL-safe slug from a title.
 * Normalizes apostrophes and strips diacritics so that e.g.
 * "L'Étranger" and "L'Etranger" produce the same slug.
 */
export function generateSlug(title) {
  return title
    .replace(/[\u00B4\u2018\u2019\u0027]/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Clean title for matching/grouping purposes.
 * Removes pipe/bullet separators and parenthetical content.
 * Normalizes apostrophe variants and strips diacritics so that e.g.
 * "L'Étranger", "L'Etranger", and "L\u2019Etranger" all map to the same key.
 * NOTE: used only for grouping/cache keys, not for display.
 * e.g., "Film (ENG subs) | Event" -> "film"
 */
export function cleanTitle(title) {
  return title
    .split(/[|•]/)[0]
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[\u00B4\u2018\u2019\u0027]/g, "'")
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

/**
 * Extract variant info from title (e.g., "50th Anniversary").
 * Handles both "Film (variant)" and "Film (variant) | Event" formats.
 * Excludes subtitle-related variants since those are handled by the subtitles field.
 */
export function extractVariant(title) {
  // First strip any "| suffix" part
  const baseTitle = title.split(/[|•]/)[0].trim();
  const match = baseTitle.match(/\s*\(([^)]+)\)\s*$/);
  if (!match) return null;

  const variant = match[1];
  // Skip subtitle-related variants - these are handled by the subtitles field
  const subtitlePatterns =
    /^(eng(lish)?\s*subs?|en\s*subs?|nl\s*subs?|dutch\s*subs?|no\s*subs?|ondertitel|subs?)$/i;
  if (subtitlePatterns.test(variant.trim())) return null;

  return variant;
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
