import he from 'he';

// Cloudflare Worker proxy for cinema sources behind bot management. The URL is
// not committed; provide CF_SCRAPER_URL via the environment (.env locally, a CI
// secret in Actions).
export const CF_SCRAPER_URL = process.env.CF_SCRAPER_URL;

if (!CF_SCRAPER_URL) {
  throw new Error(
    'CF_SCRAPER_URL is not set. Add it to .env (see .env.example).'
  );
}

export function decodeAndTrim(string) {
  if (string == null || string === '') return '';
  // Coerce to a string: fast-xml-parser parses a purely numeric CDATA value
  // (e.g. a film titled "1984") as a JS number, and he.decode expects a string.
  let decoded = String(string);
  // Decode repeatedly to handle double-encoded entities (e.g. WordPress feeds
  // that emit "&amp;amp;"), stopping once the string is stable.
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

// "YYYY-MM-DD" (UTC) for a Date or date-string. Defaults to now.
export const toDateStamp = (date = new Date()) =>
  new Date(date).toISOString().split('T')[0];

// Finalize a scraper's filmMap: drop films with no showtimes, log the count,
// and return the standard { name, films } result.
export function finalizeFilms(filmMap, name, extraLog = '') {
  const films = [...filmMap.values()].filter((f) => f.showtimes.length > 0);
  console.log(
    `Found ${films.length} films with showtimes for ${name}${extraLog}`
  );
  return { name, films };
}

export async function fetchWithRetry(url, options = {}, retries = 3) {
  const { timeoutMs = 30000, ...fetchOptions } = options;
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
      console.warn(
        `  Attempt ${attempt}/${retries} failed: ${response.status} for: ${url}`
      );
    } catch (err) {
      // Network-level failure (connect timeout, DNS, reset, abort) — retry too.
      lastError = err;
      console.warn(
        `  Attempt ${attempt}/${retries} failed: ${err.message} for: ${url}`
      );
    }
    if (attempt < retries)
      await new Promise((r) => setTimeout(r, attempt * 2000));
  }
  throw new Error(
    `Failed after ${retries} attempts: ${url} (${lastError?.message})`
  );
}
