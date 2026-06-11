import he from 'he';

export function decodeAndTrim(string) {
  if (!string) return '';
  // Decode repeatedly to handle double-encoded entities (e.g. WordPress feeds
  // that emit "&amp;amp;"), stopping once the string is stable.
  let decoded = string;
  for (let i = 0; i < 3; i++) {
    const next = he.decode(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded.trim();
}

/**
 * Normalize a cinema's subtitle-language hint to a standard code.
 * Accepts a single string ("Nederlands", "eng") or an array of language
 * tokens (["en"], ["nl", "nld"]). Returns 'EN', 'NL', 'none', or null
 * (unknown / not specified).
 */
export function normalizeSubtitles(langs) {
  const tokens = (Array.isArray(langs) ? langs : [langs])
    .filter(Boolean)
    .map((l) => String(l).toLowerCase());
  if (tokens.some((t) => t === 'geen' || t === 'none')) return 'none';
  if (
    tokens.some(
      (t) =>
        t.includes('nederland') || t === 'nl' || t === 'nld' || t === 'dutch'
    )
  )
    return 'NL';
  if (tokens.some((t) => t.includes('english') || t === 'en' || t === 'eng'))
    return 'EN';
  return null;
}

export function parseFilmLength(filmLength) {
  if (!filmLength) return null;
  const match = String(filmLength).match(/\d+/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

export async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    console.warn(
      `  Attempt ${attempt}/${retries} failed: ${response.status} for: ${url}`
    );
    if (attempt < retries)
      await new Promise((r) => setTimeout(r, attempt * 2000));
  }
  throw new Error(`Failed after ${retries} attempts: ${url}`);
}
