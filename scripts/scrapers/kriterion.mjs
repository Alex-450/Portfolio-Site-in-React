import { fetchWithRetry, decodeAndTrim } from './utils.mjs';

const KRITERION_URL =
  'https://storage.googleapis.com/kritsite-buffer/shows.json';

async function fetchKriterion() {
  console.log('Fetching Kriterion...');
  const response = await fetchWithRetry(KRITERION_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
    },
  });
  const data = await response.json();
  const filmMap = new Map();

  for (const show of data.shows || []) {
    if (show.is_deleted === 'true' || show.is_deleted === true) continue;

    const key = show.production_id || show.name;
    if (!filmMap.has(key)) {
      // Normalize subtitle_languages to standard code
      let subtitles = null;
      const subLangs = show.subtitle_languages || [];
      if (subLangs.includes('en') || subLangs.includes('eng')) {
        subtitles = 'EN';
      } else if (subLangs.includes('nl') || subLangs.includes('nld')) {
        subtitles = 'NL';
      }

      filmMap.set(key, {
        title: decodeAndTrim(show.display_name) || decodeAndTrim(show.name),
        director: show.director || null,
        runtime: show.duration ? parseInt(show.duration, 10) : null,
        posterUrl: '',
        showtimes: [],
        subtitles,
        _needsTmdbSearch: true,
      });
    }

    const film = filmMap.get(key);
    const startsAt = new Date(show.starts_at);
    const date = startsAt.toISOString().split('T')[0];
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

  const films = [...filmMap.values()].filter((f) => f.showtimes.length > 0);
  console.log(`Found ${films.length} films with showtimes for Kriterion`);
  return { name: 'Kriterion', films };
}

export { fetchKriterion };
