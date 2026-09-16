import {
  fetchWithRetry,
  decodeAndTrim,
  finalizeFilms,
  parseEventDateTime,
  parseFilmLength,
  normalizeSubtitles,
} from './utils.mjs';
import { cleanTitle } from '../../src/utils/filmTitle.mjs';

// The ticketing system carries no metadata, so directors come from the website's
// Strapi API instead. Without a director TMDB can't credit-validate a match and
// skips the film entirely, so this is what gets Kriterion films enriched.
const FILMS_API_URL =
  'https://www.kriterion.nl/api/films?pagination[pageSize]=200';

const TICKETS_BASE = 'https://tickets.kriterion.nl/kriterion/en/flow_configs';
const EVENTS_LIST_URL = `${TICKETS_BASE}/1/z_events_list`;
const SHOW_URL_BASE = `${TICKETS_BASE}/webshop/steps/start/show`;

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

const SCREEN_PATTERN =
  /\d{1,2}\s+[A-Za-z]+\s+\d{4},\s*\d{1,2}:\d{2}\s*-\s*([^<\n]{1,30})/;

async function fetchHtml(url) {
  const response = await fetchWithRetry(url, { headers: BROWSER_HEADERS });
  return response.text();
}

// The events list page renders a "Products" table (season tickets, discounts)
// before the "Shows" table. Scope parsing to the shows table so ticket products
// aren't mistaken for screenings.
function parseEventRows(html) {
  const showsHeading = html.indexOf('<h2>Shows</h2>');
  const scope = showsHeading === -1 ? html : html.slice(showsHeading);

  const rows = [];
  for (const [, row] of scope.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const title = row.match(/<h4[^>]*>([\s\S]*?)<\/h4>/)?.[1];
    const when = row.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1];
    const showId = row.match(/\/show\/(\d+)/)?.[1];
    if (!title || !when || !showId) continue;

    const when_ = parseEventDateTime(
      decodeAndTrim(when.replace(/<[^>]+>/g, ' '))
    );
    if (!when_) continue;

    rows.push({
      title: decodeAndTrim(title.replace(/<[^>]+>/g, ' ')),
      showId,
      date: when_.date,
      time: when_.time,
    });
  }
  return rows;
}

// Screen names ("K 1") only exist on a show's own page, next to its start time.
// Fetch them with limited concurrency; a show whose page fails just loses its
// screen rather than failing the cinema.
async function fetchScreens(shows, concurrency = 8) {
  const screens = new Map();
  const queue = [...shows];
  let failures = 0;

  const worker = async () => {
    while (queue.length > 0) {
      const show = queue.shift();
      try {
        const html = await fetchHtml(`${SHOW_URL_BASE}/${show.showId}`);
        const screen = html.match(SCREEN_PATTERN)?.[1];
        if (screen) screens.set(show.showId, decodeAndTrim(screen));
      } catch {
        failures++;
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, shows.length) }, worker)
  );

  if (failures > 0) {
    console.warn(
      `  Kriterion: ${failures} show pages failed — screens omitted`
    );
  }
  return screens;
}

// Map cleanTitle(title) -> { director, runtime, subtitles } from the site API.
// Ticket titles and API titles differ in their annotations ("Los Tigres (ENG
// subs)" vs "Los Tigres | Moderne Klassieker"), so key on the cleaned title,
// which strips both parentheticals and pipe suffixes.
async function fetchFilmMetadata() {
  const byTitle = new Map();
  try {
    const res = await fetchWithRetry(FILMS_API_URL, {
      headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
    });
    const { data } = await res.json();
    for (const entry of data || []) {
      const a = entry?.attributes;
      if (!a?.titel) continue;
      const key = cleanTitle(a.titel);
      // Keep the first entry with a director: the API lists near-duplicate rows
      // per subtitle variant, and a later one may have an empty regie field.
      if (byTitle.get(key)?.director) continue;
      byTitle.set(key, {
        director: a.regie?.trim() || null,
        runtime: a.speelduur ? parseFilmLength(a.speelduur) : null,
        subtitles: a.ondertitels ? normalizeSubtitles(a.ondertitels) : null,
      });
    }
  } catch {
    // Metadata is an enhancement; a failure here must not lose the showtimes.
    console.warn('Kriterion: film metadata API failed — continuing without it');
  }
  return byTitle;
}

async function fetchKriterion() {
  console.log('Fetching Kriterion...');

  const shows = parseEventRows(await fetchHtml(EVENTS_LIST_URL));
  if (shows.length === 0) {
    throw new Error('Kriterion: no shows found in ticketing event list');
  }

  // The event list keeps long-past shows around (a 2023 screening is still
  // listed), so drop anything before today.
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Amsterdam',
  });
  const upcoming = shows.filter((show) => show.date >= today);
  const skippedPast = shows.length - upcoming.length;

  const [screens, metadata] = await Promise.all([
    fetchScreens(upcoming),
    fetchFilmMetadata(),
  ]);

  const filmMap = new Map();
  for (const show of upcoming) {
    if (!filmMap.has(show.title)) {
      const meta = metadata.get(cleanTitle(show.title));
      filmMap.set(show.title, {
        title: show.title,
        director: meta?.director || null,
        runtime: meta?.runtime || null,
        subtitles: meta?.subtitles || null,
        posterUrl: '',
        showtimes: [],
      });
    }

    filmMap.get(show.title).showtimes.push({
      date: show.date,
      time: show.time,
      ticketUrl: `${SHOW_URL_BASE}/${show.showId}`,
      screen: screens.get(show.showId) || '',
    });
  }

  return finalizeFilms(
    filmMap,
    'Kriterion',
    ` (${screens.size}/${upcoming.length} screens${skippedPast ? `, ${skippedPast} past shows skipped` : ''})`
  );
}

export { fetchKriterion };
