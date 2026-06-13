import { fetchWithRetry, decodeAndTrim, finalizeFilms } from './utils.mjs';

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
      // Group screenings of the same film. film_id is stable; fall back to title.
      const key = show.film_id ?? show.title;
      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title: decodeAndTrim(show.title),
          director: null,
          runtime: null,
          posterUrl: '',
          showtimes: [],
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

  return finalizeFilms(filmMap, name);
}

// Returns an array of { name, films } — one per Rialto venue — so the caller
// can treat each venue as its own cinema.
async function fetchRialto() {
  console.log('Fetching Rialto...');
  return Promise.all(VENUES.map(fetchVenue));
}

export { fetchRialto };
