import {
  fetchWithRetry,
  decodeAndTrim,
  finalizeFilms,
  parseEventDateTime,
} from './utils.mjs';

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

  const screens = await fetchScreens(upcoming);

  const filmMap = new Map();
  for (const show of upcoming) {
    if (!filmMap.has(show.title)) {
      filmMap.set(show.title, {
        title: show.title,
        director: null,
        runtime: null,
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
