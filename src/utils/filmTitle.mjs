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
    .replace(/\s*\[[^\]]*\]\s*/g, ' ') // strip [35mm], [OV], etc.
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+incl\..*$/i, '') // strip "incl. panel talk" etc.
    .replace(/[\u00B4\u2018\u2019\u0027]/g, "'")
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/–/, '-')
    .replace(/^(.+?),\s+(the|a|an)\s*$/i, '$2 $1') // "Quiet Girl, The" -> "The Quiet Girl"
    .trim()
    .toLowerCase();
}

// Subtitle-related parentheticals — handled by the subtitles field, not shown
// as a title or variant.
const subtitlePatterns =
  /^(eng(lish)?\s*subs?|en\s*subs?|nl\s*subs?|dutch\s*subs?|no\s*subs?|ondertitel|subs?)$/i;

/**
 * Whether a trailing parenthetical is an annotation (variant/subtitle/year) that
 * should be stripped from the display title, rather than part of the real title.
 * e.g. "(ENG subs)", "(1971)", "(50th Anniversary)" are annotations;
 * "(The Unexpected Virtue of Ignorance)" is not.
 */
function isAnnotation(inner) {
  const v = inner.trim();
  return (
    subtitlePatterns.test(v) ||
    /^\d{4}$/.test(v) ||
    /\b(anniversary|restoration|restored|remaster(ed)?|cut|extended|uncut|\dk|mm|ov|imax|q&a|sing[- ]?along)\b/i.test(
      v
    )
  );
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

  const variant = match[1].trim();
  // Skip subtitle-related variants - these are handled by the subtitles field
  if (subtitlePatterns.test(variant)) return null;
  // Skip bare release-year variants (e.g. "(1971)") — already shown as releaseYear
  if (/^\d{4}$/.test(variant)) return null;
  // Only treat recognized annotations as variants; an unrecognized parenthetical
  // is part of the real title (e.g. "Birdman or (The Unexpected Virtue...)").
  if (!isAnnotation(variant)) return null;

  return match[1];
}

/**
 * Get clean title for display (remove variant suffix and event suffix).
 * A trailing parenthetical is only stripped when it's a recognized annotation
 * (variant/subtitle/year); otherwise it's kept as part of the real title.
 * e.g. "Film (ENG subs) | Event" -> "Film";
 *      "Birdman or (The Unexpected Virtue of Ignorance)" is left intact.
 */
export function getCleanDisplayTitle(title) {
  return title
    .split(/[|•]/)[0]
    .replace(/\s*\(([^)]*)\)\s*$/, (full, inner) =>
      isAnnotation(inner) ? '' : full
    )
    .trim();
}
