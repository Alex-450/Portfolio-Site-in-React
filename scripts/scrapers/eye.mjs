import { fetchWithRetry, decodeAndTrim } from './utils.mjs';

const EYE_URL = 'https://service.eyefilm.nl/graphql';

// Eye uses UUIDs for subtitle languages - map known ones
const SUBTITLE_MAP = {
  '42c27a5b-2d4e-4195-b547-cb6fbe9fcd49': 'EN', // English subtitles
  '41ad8fc8-2c17-46fd-9094-fb3d4a2884fa': 'NL', // Dutch subtitles
  '6e5a13f9-22d0-401c-a5e9-7d3b14578eaf': null, // No subtitles (silent/English films)
};

async function fetchEye() {
  console.log('Fetching Eye...');

  const today = new Date().toISOString().split('T')[0];
  const query = `query shows($site: String!, $startDateTime: String, $offset: Int, $limit: Int, $sort: ShowSortEnum) {
    shows: show(site: $site, startDateTime: $startDateTime, offset: $offset, limit: $limit, sort: $sort) {
      id
      startDateTime
      endDateTime
      cinemaRoom
      ticketUrl
      singleSubtitle
      production { id url title }
      relatedProduction { productionType }
    }
  }`;

  const response = await fetchWithRetry(EYE_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
      'Origin': 'https://www.eyefilm.nl',
    },
    body: JSON.stringify({
      query,
      variables: {
        site: 'eyeNederlands',
        startDateTime: `> ${today}`,
        offset: 0,
        limit: 200,
        sort: 'DATE',
      },
      operationName: 'shows',
    }),
  });

  const data = await response.json();
  // Group by production ID + subtitle language to create separate entries for different subtitle versions
  const filmMap = new Map();

  for (const show of data.data?.shows || []) {
    // Skip non-film productions (productionType 1 = films, 2 = events/workshops)
    if (show.relatedProduction?.productionType !== '1') continue;

    const production = show.production?.[0];
    if (!production?.title) continue;

    // Get subtitle language and add suffix
    const subtitleLang = SUBTITLE_MAP[show.singleSubtitle];
    const suffix = subtitleLang === 'EN' ? ' (ENG SUBS)' : subtitleLang === 'NL' ? ' (NL SUBS)' : '';
    const key = `${production.id}-${show.singleSubtitle || 'none'}`;

    if (!filmMap.has(key)) {
      // Calculate duration from start/end times
      const start = new Date(show.startDateTime);
      const end = new Date(show.endDateTime);
      const durationMinutes = Math.round((end - start) / 60000);

      filmMap.set(key, {
        title: decodeAndTrim(production.title) + suffix,
        director: null,
        length: durationMinutes > 0 ? `${durationMinutes} minutes` : null,
        posterUrl: '',
        showtimes: [],
        _needsTmdbSearch: true,
      });
    }

    const film = filmMap.get(key);
    const startDt = new Date(show.startDateTime);
    const date = startDt.toISOString().split('T')[0];
    const time = startDt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    film.showtimes.push({
      date,
      time,
      ticketUrl: show.ticketUrl || '',
      screen: show.cinemaRoom || '',
    });
  }

  const films = [...filmMap.values()].filter(f => f.showtimes.length > 0);
  console.log(`Found ${films.length} films with showtimes for Eye`);
  return { name: 'Eye', films };
}

export { fetchEye };
