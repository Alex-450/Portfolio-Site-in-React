import { readFileSync, writeFileSync, existsSync } from 'fs';
import {
  fetchWithRetry,
  decodeAndTrim,
  parseFilmLength,
  finalizeFilms,
  normalizeSubtitles,
} from './utils.mjs';

// Rialto VU is served from the VU Griffioen site, which has no structured film
// feed: the program list comes from /shows.php as a rendered HTML fragment (with
// the useful bits in data-* / onclick attributes), and each film's detail page
// carries a labelled spec block (director/runtime/subtitles).
//
// Strategy (mirrors eye.mjs): read all showings from /shows.php, group them by
// film slug, then fetch each unique film's detail page once for its metadata,
// caching by slug on disk across builds.
const BASE = 'https://griffioen.vu.nl';
const VENUE_NAME = 'Rialto VU';

const GRIFFIOEN_CACHE_PATH = 'src/data/griffioen-cache.json';
let griffioenCache = existsSync(GRIFFIOEN_CACHE_PATH)
  ? JSON.parse(readFileSync(GRIFFIOEN_CACHE_PATH, 'utf-8'))
  : {};
const saveGriffioenCache = () =>
  writeFileSync(GRIFFIOEN_CACHE_PATH, JSON.stringify(griffioenCache, null, 2));

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Each program-item in the /shows.php fragment is one screening:
//   data-showid="5766" ... onclick="document.location='/film/{slug}/{DD-MM-YYYY-HH-MM}'"
//   <img ... alt="{title}"> ... <span class="genre">{genre}</span>
const ITEM_RE =
  /data-showid="(\d+)"[^>]*onclick="document\.location='\/film\/([^/]+)\/(\d{2})-(\d{2})-(\d{4})-(\d{2})-(\d{2})'"[\s\S]*?alt="([^"]*)"/g;

// Pull one screening's showings from a /shows.php page. Returns { shows, pages }.
async function fetchShowsPage(page) {
  const url = `${BASE}/shows.php?type=film&genres=&dates=${
    page > 1 ? `&page=${page}` : ''
  }`;
  const res = await fetchWithRetry(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const data = await res.json();
  const shows = [];
  for (const [, showId, slug, dd, mm, yyyy, hh, min, title] of (
    data.html ?? ''
  ).matchAll(ITEM_RE)) {
    shows.push({
      showId,
      slug,
      title: decodeAndTrim(title),
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
    });
  }
  return { shows, pages: data.pages ?? 1 };
}

// Fetch a film's detail page and parse director/runtime/subtitles from its
// labelled <strong>Label </strong>value<br /> spec block. Cached by slug.
async function fetchFilmMetadata(slug) {
  if (griffioenCache[slug]) return griffioenCache[slug];

  const empty = { director: null, runtime: null, subtitles: null };
  try {
    const res = await fetchWithRetry(`${BASE}/film/${slug}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    });
    const html = await res.text();

    const pairs = {};
    for (const [, label, value] of html.matchAll(
      /<strong>([^<]+?)\s*<\/strong>\s*([^<]+?)\s*<br/g
    )) {
      pairs[label.trim()] = decodeAndTrim(value);
    }

    const result = {
      director: pairs['Regie'] || null,
      runtime: pairs['Speelduur'] ? parseFilmLength(pairs['Speelduur']) : null,
      // "Ondertiteling" (subtitles) is a language name like "Nederlands".
      subtitles: pairs['Ondertiteling']
        ? normalizeSubtitles(pairs['Ondertiteling'])
        : null,
    };
    griffioenCache[slug] = result;
    saveGriffioenCache();
    return result;
  } catch {
    return empty;
  }
}

async function fetchGriffioen() {
  console.log('Fetching Griffioen (Rialto VU)...');

  // Page through /shows.php to collect every film screening.
  const first = await fetchShowsPage(1);
  const allShows = [...first.shows];
  for (let page = 2; page <= first.pages; page++) {
    const { shows } = await fetchShowsPage(page);
    allShows.push(...shows);
  }

  // Group screenings by film slug.
  const filmMap = new Map();
  for (const show of allShows) {
    if (!filmMap.has(show.slug)) {
      filmMap.set(show.slug, {
        title: show.title,
        director: null,
        runtime: null,
        posterUrl: `${BASE}/resolve/image/${show.showId}/400x600`,
        subtitles: null,
        showtimes: [],
      });
    }
    filmMap.get(show.slug).showtimes.push({
      date: show.date, // YYYY-MM-DD
      time: show.time, // HH:MM
      ticketUrl: `${BASE}/bestel/${show.showId}`,
      screen: '',
    });
  }

  // Enrich each unique film with detail-page metadata (cached by slug on disk).
  console.log(
    `Fetching Griffioen metadata for ${filmMap.size} unique films...`
  );
  await Promise.all(
    [...filmMap.entries()].map(async ([slug, film]) => {
      const meta = await fetchFilmMetadata(slug);
      film.director = meta.director;
      film.runtime = meta.runtime;
      if (meta.subtitles) film.subtitles = meta.subtitles;
    })
  );

  return finalizeFilms(
    filmMap,
    VENUE_NAME,
    ` (${allShows.length} total showings fetched)`
  );
}

export { fetchGriffioen };
