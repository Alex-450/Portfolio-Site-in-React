import {
  fetchWithRetry,
  decodeAndTrim,
  parseFilmLength,
  finalizeFilms,
  normalizeSubtitles,
  toDateStamp,
} from './utils.mjs';

// Each venue has its own subdomain and a POST-based JSON API that backs the
// agenda page. Everything we need is inline (poster, runtime, genres, showtimes),
// so there's no per-film detail page to scrape.
//
// Endpoint (internal, undocumented — powers the site's own JS):
//   POST {apiBase}/nl/api/events/programs
//   body: { filters: { startAt }, pagination: { page, pageSize }, sortings: [] }
// Each response entry is a single screening: film metadata plus one `program`
// (start time, screen, ticket link, cancel flag). We page through and group the
// screenings back into films ourselves.
//
// If Rialto starts blocking the CI runner IP, route these through the Cloudflare
// worker by adding `rialto-de-pijp`/`rialto-silo` targets there and switching to
// `${CF_SCRAPER_URL}?target=...` (see kriterion.mjs / rss-feeds.mjs).
const VENUES = [
  { name: 'Rialto De Pijp', apiBase: 'https://depijp.rialtofilm.nl/prod' },
  // Rialto VU is a separate venue served from griffioen.vu.nl (see griffioen.mjs).
  { name: 'Rialto Silo', apiBase: 'https://silo.rialtofilm.nl/prod' },
];

const PAGE_SIZE = 100;

// Rialto appends things after a dash on the title. Some are screening labels
// that aren't part of the film ("Gohan - eng subs", "Dead Man - Jim Jarmusch
// Revisited", "... - Hot Town, Summer in the City"); others are the film's real
// subtitle ("Rally - van Parijs naar de Piramides"). No text rule reliably tells
// a series label from a genuine subtitle, so we DON'T strip the general suffix
// here — we keep the full title (correct for display, grouping, and slugs) and
// let the TMDB matcher retry with the suffix removed (see tmdb.mjs). The one
// exception is the subtitle-language hint, which is a tight, safe pattern and
// also carries the `subtitles` code, so we still split that off.
const SUBTITLE_SUFFIX = /^(eng?|nl|dutch|english)\s*subs?$/i;

// Some Rialto entries append the film's original year in brackets ("Vertigo
// (1958)") to disambiguate re-releases. That year is not part of the real title,
// but it IS the authoritative year for the film — Rialto's own `releaseDate`
// field holds the *re-release* year, which sends TMDB looking for a film that
// doesn't exist. So strip a trailing "(YYYY)" (19xx/20xx) from the title and
// surface the captured year separately.
const YEAR_SUFFIX = /\s*\(((?:19|20)\d{2})\)\s*$/;

// Strip a trailing "(YYYY)" from a title, returning { title, year } where year
// is a number or null.
function extractYear(title) {
  const match = title.match(YEAR_SUFFIX);
  return {
    title: title.replace(YEAR_SUFFIX, '').trim(),
    year: match ? Number(match[1]) : null,
  };
}

function parseTitle(rawTitle) {
  const match = rawTitle.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  // Only split off a subtitle-language hint; every other suffix is kept as part
  // of the title (the TMDB matcher strips it as a fallback if needed).
  if (match && SUBTITLE_SUFFIX.test(match[2].trim())) {
    const subtitles = normalizeSubtitles(
      match[2].trim().replace(/\s*subs?$/i, '')
    );
    const { title, year } = extractYear(match[1]);
    return { title, subtitles, year };
  }
  const { title, year } = extractYear(rawTitle);
  return { title, subtitles: null, year };
}

// Rialto's `cast` field is inconsistent: for new releases it lists the actual
// cast (several comma-separated names), but for repertory/classic re-releases
// it holds a single name — the director. When it's a lone name, treat it as the
// director. That gives TMDB a credit-validated match (far safer than title-only)
// for old films whose Rialto releaseDate is just the re-release date. A wrong
// guess simply fails TMDB's credit check and is skipped — no bad data attaches.
function directorFromCast(cast) {
  if (!cast) return null;
  const names = cast
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
  return names.length === 1 ? names[0] : null;
}

// Fetch every page of the events/programs feed for a venue and return the flat
// list of screening entries.
async function fetchPrograms(apiBase) {
  const url = `${apiBase}/nl/api/events/programs`;
  const body = (page) => ({
    filters: { startAt: `${toDateStamp()}T00:00:00.000Z`, searchTerm: '' },
    pagination: { page, pageSize: PAGE_SIZE },
    sortings: [],
  });
  const post = (page) =>
    fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
      },
      body: JSON.stringify(body(page)),
    });

  const first = await (await post(1)).json();
  const entries = [...(first.events ?? [])];
  const pages = first.pagination?.pages ?? 1;
  for (let page = 2; page <= pages; page++) {
    const next = await (await post(page)).json();
    entries.push(...(next.events ?? []));
  }
  return entries;
}

async function fetchVenue({ name, apiBase }) {
  const entries = await fetchPrograms(apiBase);

  const filmMap = new Map();
  for (const entry of entries) {
    const program = entry.program;
    if (!program || program.isCanceled) continue;
    // "verwacht" (expected) placeholder screenings have no real time and come
    // through as midnight; skip them so we only list bookable showtimes.
    const startAt = program.startAt || entry.startAt;
    if (!startAt) continue;
    const [date, timePart] = startAt.split('T');
    const time = timePart?.slice(0, 5);
    if (!date || !time || time === '00:00') continue;

    const { title, subtitles, year: titleYear } = parseTitle(
      decodeAndTrim(entry.title)
    );

    // Group screenings of the same film. The event `id` is stable; fall back to
    // title. Separate the subtitle variant so an "eng subs" screening is its own
    // group (and renders its own subtitles badge) but still shares the clean
    // title with the plain version for cross-cinema grouping.
    const key = `${entry.id ?? title}-${subtitles ?? ''}`;
    if (!filmMap.has(key)) {
      const fields = entry.fields ?? {};
      filmMap.set(key, {
        title,
        // A lone name in `cast` is really the director for repertory titles;
        // otherwise leave null and let TMDB fill it in later.
        director: directorFromCast(fields.cast),
        // Only trust a "(YYYY)" explicitly in the title. Rialto's `releaseDate`
        // field is the screening / re-release date, not the film's production
        // year — passing it to TMDB caused false matches (e.g. a generic title
        // colliding with an unrelated same-year film), so we never use it.
        year: titleYear,
        runtime: parseFilmLength(fields.duration),
        // Prefer Rialto's poster only as a fallback; TMDB art usually wins later.
        posterUrl: entry.image1?.url || '',
        subtitles,
        showtimes: [],
      });
    }

    filmMap.get(key).showtimes.push({
      date, // YYYY-MM-DD
      time, // HH:MM
      ticketUrl: program.button?.link || entry.url || '',
      screen: program.location?.name || '',
    });
  }

  return finalizeFilms(filmMap, name);
}

// Returns an array of { name, films } — one per Rialto venue — so the caller
// can treat each venue as its own cinema.
async function fetchRialto() {
  console.log('Fetching Rialto...');
  // Fetch venues independently so one being offline doesn't take down the other.
  const results = await Promise.allSettled(VENUES.map(fetchVenue));
  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(`  ${VENUES[i].name} failed: ${result.reason?.message}`);
    return { name: VENUES[i].name, films: [] };
  });
}

export { fetchRialto };
