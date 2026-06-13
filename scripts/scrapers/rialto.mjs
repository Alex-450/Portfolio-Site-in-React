import { readFileSync, writeFileSync, existsSync } from 'fs';
import {
  fetchWithRetry,
  decodeAndTrim,
  parseFilmLength,
  finalizeFilms,
  normalizeSubtitles,
} from './utils.mjs';

// Per-film metadata (director/year/runtime/poster) lives only in the SSR film
// page HTML — there's no JSON feed for it. Cache by film_id on disk so each page
// is fetched once across builds (same approach as the Eye scraper).
const RIALTO_CACHE_PATH = 'src/data/rialto-cache.json';
let rialtoCache = existsSync(RIALTO_CACHE_PATH)
  ? JSON.parse(readFileSync(RIALTO_CACHE_PATH, 'utf-8'))
  : {};
const saveRialtoCache = () =>
  writeFileSync(RIALTO_CACHE_PATH, JSON.stringify(rialtoCache, null, 2));

// Fetch a film's detail page and parse its <dl> metadata + poster. The page is
// server-rendered, so the fields are in the raw HTML.
async function fetchFilmMetadata(filmId, filmUrl) {
  if (filmId != null && rialtoCache[filmId]) return rialtoCache[filmId];
  if (!filmUrl) return { director: null, year: null, runtime: null };

  try {
    const res = await fetchWithRetry(filmUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const html = await res.text();

    const pairs = {};
    for (const [, label, value] of html.matchAll(
      /<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g
    )) {
      pairs[label.trim()] = decodeAndTrim(value.replace(/<[^>]+>/g, ' '));
    }
    const poster = html.match(/og:image"\s+content="([^"]+)"/)?.[1] ?? '';

    const result = {
      director: pairs['Regisseur'] || null,
      year: pairs['Jaartal'] ? parseInt(pairs['Jaartal'], 10) : null,
      runtime: pairs['Duur'] ? parseFilmLength(pairs['Duur']) : null,
      posterUrl: poster,
    };
    if (filmId != null) {
      rialtoCache[filmId] = result;
      saveRialtoCache();
    }
    return result;
  } catch {
    return { director: null, year: null, runtime: null, posterUrl: '' };
  }
}

// Rialto appends a screening label after a dash on the title: subtitles
// ("Blue Heron - eng subs"), previews ("Yellow Letters - Cineville Preview"),
// or a retrospective series ("Dead Man - Jim Jarmusch Revisited"). None of these
// are part of the film's real title. Since the feed has no structured field for
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

// Rialto's two venues share one JSON program feed, keyed by "building" id.
// The feed returns ~28 days of programming: an array of days, each with a
// `programs` array of individual screenings.
// Endpoint shape comes from the site's bundle: /feed/{lang}/program/{building}/28
//
// This is an internal (undocumented) endpoint that powers the site's own JS,
// not a public API. We fetch it directly for now (like Eye) since it has no bot
// protection today. If Rialto starts blocking the CI runner IP, route it through
// the Cloudflare worker by adding `rialto-de-pijp`/`rialto-vu` targets there and
// switching to `${CF_SCRAPER_URL}?target=...` (see kriterion.mjs / rss-feeds.mjs).
const VENUES = [
  { building: 1, name: 'Rialto De Pijp' },
  { building: 7, name: 'Rialto VU' },
];

const feedUrl = (building) =>
  `https://rialtofilm.nl/feed/nl/program/${building}/28`;

async function fetchVenue({ building, name }) {
  const response = await fetchWithRetry(feedUrl(building), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
    },
  });
  const days = await response.json();

  const filmMap = new Map();
  for (const day of days) {
    for (const show of day.programs ?? []) {
      const { title, subtitles } = parseTitle(decodeAndTrim(show.title));

      // Group screenings of the same film. film_id is stable; fall back to
      // title. Separate the subtitle variant so an "eng subs" screening is its
      // own group (and renders its own subtitles badge) but still shares the
      // clean title with the plain version for cross-cinema grouping.
      const key = `${show.film_id ?? title}-${subtitles ?? ''}`;
      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title,
          director: null,
          runtime: null,
          posterUrl: '',
          subtitles,
          showtimes: [],
          _filmId: show.film_id ?? null,
          _filmUrl: show.film_url ?? null,
        });
      }

      if (!show.date || !show.starts_at) continue;
      filmMap.get(key).showtimes.push({
        date: show.date, // already YYYY-MM-DD
        time: show.starts_at, // HH:MM
        ticketUrl: show.selected_time_url || show.film_url,
        screen: '',
      });
    }
  }

  // Enrich each film with director/year/runtime/poster from its SSR detail page
  // (cached on disk by film_id, so only new films are fetched each build).
  await Promise.all(
    [...filmMap.values()].map(async (film) => {
      const meta = await fetchFilmMetadata(film._filmId, film._filmUrl);
      film.director = meta.director;
      film.year = meta.year;
      film.runtime = meta.runtime;
      // Prefer Rialto's poster only as a fallback; TMDB art usually wins later.
      film.posterUrl = meta.posterUrl || '';
    })
  );

  return finalizeFilms(filmMap, name);
}

// Returns an array of { name, films } — one per Rialto venue — so the caller
// can treat each venue as its own cinema.
async function fetchRialto() {
  console.log('Fetching Rialto...');
  return Promise.all(VENUES.map(fetchVenue));
}

export { fetchRialto };
