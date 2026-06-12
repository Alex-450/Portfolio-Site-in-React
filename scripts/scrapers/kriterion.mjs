import {
  fetchWithRetry,
  decodeAndTrim,
  normalizeSubtitles,
  finalizeFilms,
  toDateStamp,
  CF_SCRAPER_URL,
} from './utils.mjs';

async function fetchKriterion() {
  console.log('Fetching Kriterion...');
  const token = process.env.CF_SCRAPER_TOKEN;
  const response = await fetchWithRetry(`${CF_SCRAPER_URL}?target=kriterion`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await response.json();
  const filmMap = new Map();

  for (const show of data.shows || []) {
    if (show.is_deleted === 'true' || show.is_deleted === true) continue;

    const key = show.production_id || show.name;
    if (!filmMap.has(key)) {
      filmMap.set(key, {
        title: decodeAndTrim(show.display_name) || decodeAndTrim(show.name),
        director: show.director || null,
        subtitles: normalizeSubtitles(show.subtitle_languages),
        runtime: show.duration ? parseInt(show.duration, 10) : null,
        posterUrl: '',
        showtimes: [],
      });
    }

    const film = filmMap.get(key);
    const date = toDateStamp(show.starts_at);
    const time = show.start_time;

    if (date && time) {
      film.showtimes.push({
        date,
        time,
        ticketUrl: `https://tickets.kriterion.nl/kriterion/nl/flow_configs/webshop/steps/start/show/${show.id}`,
        screen: show.theatre_name || '',
      });
    }
  }

  return finalizeFilms(filmMap, 'Kriterion');
}

export { fetchKriterion };
