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

// Rialto appends a screening label after a dash on the title: subtitles
// ("Gohan - eng subs"), previews ("Woman and Child - Cineville Preview"), or a
// retrospective series ("Dead Man - Jim Jarmusch Revisited"). None of these are
// part of the film's real title. Since the feed has no structured field for
// them, treat any trailing " - <suffix>" as a label: strip it, and if it's a
// subtitle hint, surface that as the subtitles code. Returns { title, subtitles }.
const SUBTITLE_SUFFIX = /^(eng?|nl|dutch|english)\s*subs?$/i;

function parseTitle(rawTitle) {
  const match = rawTitle.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (!match) return { title: rawTitle, subtitles: null };
  const [, base, suffix] = match;
  const subtitles = SUBTITLE_SUFFIX.test(suffix.trim())
    ? normalizeSubtitles(suffix.trim().replace(/\s*subs?$/i, ''))
    : null;
  return { title: base.trim(), subtitles };
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

    const { title, subtitles } = parseTitle(decodeAndTrim(entry.title));

    // Group screenings of the same film. The event `id` is stable; fall back to
    // title. Separate the subtitle variant so an "eng subs" screening is its own
    // group (and renders its own subtitles badge) but still shares the clean
    // title with the plain version for cross-cinema grouping.
    const key = `${entry.id ?? title}-${subtitles ?? ''}`;
    if (!filmMap.has(key)) {
      const fields = entry.fields ?? {};
      filmMap.set(key, {
        title,
        director: null, // Not exposed by the new API; TMDB fills this in later.
        year: fields.releaseDate
          ? new Date(fields.releaseDate).getFullYear()
          : null,
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
