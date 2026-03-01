import { fetchWithRetry, decodeAndTrim } from './utils.mjs';

const EYE_URL = 'https://service.eyefilm.nl/graphql';

// Eye uses UUIDs for subtitle languages - map known ones
const SUBTITLE_MAP = {
  '42c27a5b-2d4e-4195-b547-cb6fbe9fcd49': 'EN', // English subtitles
  '41ad8fc8-2c17-46fd-9094-fb3d4a2884fa': 'NL', // Dutch subtitles
  '6e5a13f9-22d0-401c-a5e9-7d3b14578eaf': null, // No subtitles (silent/English films)
};

const PAGE_SIZE = 200;

async function fetchEyePage(today, offset) {
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
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
      Origin: 'https://www.eyefilm.nl',
    },
    body: JSON.stringify({
      query,
      variables: {
        site: 'eyeNederlands',
        startDateTime: `> ${today}`,
        offset,
        limit: PAGE_SIZE,
        sort: 'DATE',
      },
      operationName: 'shows',
    }),
  });

  const data = await response.json();
  return data.data?.shows || [];
}

async function fetchEye() {
  console.log('Fetching Eye...');

  const today = new Date().toISOString().split('T')[0];

  // Paginate until we get fewer results than PAGE_SIZE
  const allShows = [];
  let offset = 0;
  while (true) {
    const page = await fetchEyePage(today, offset);
    allShows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // Group by production ID + subtitle language to create separate entries for different subtitle versions
  const filmMap = new Map();
  const unknownSubtitleUuids = new Set();

  for (const show of allShows) {
    // Skip non-film productions (productionType 1 = films, 2 = events/workshops)
    if (show.relatedProduction?.productionType !== '1') continue;

    const production = show.production?.[0];
    if (!production?.title) continue;

    // Get subtitle language — log unknown UUIDs so we notice if Eye changes them
    const uuid = show.singleSubtitle;
    const subtitleLang =
      uuid && !(uuid in SUBTITLE_MAP)
        ? (unknownSubtitleUuids.add(uuid), null)
        : SUBTITLE_MAP[uuid];
    const key = `${production.id}-${uuid || 'none'}`;

    if (!filmMap.has(key)) {
      filmMap.set(key, {
        title: decodeAndTrim(production.title),
        director: null,
        runtime: null,
        posterUrl: '',
        showtimes: [],
        subtitles: subtitleLang ?? null,
        _needsTmdbSearch: true,
      });
    }

    const film = filmMap.get(key);
    const startDt = new Date(show.startDateTime);
    const date = startDt.toISOString().split('T')[0];
    const time = startDt.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Amsterdam',
    });

    film.showtimes.push({
      date,
      time,
      ticketUrl: show.ticketUrl || '',
      screen: show.cinemaRoom || '',
    });
  }

  if (unknownSubtitleUuids.size > 0) {
    console.warn(`Eye: unknown subtitle UUIDs (subtitles will be null): ${[...unknownSubtitleUuids].join(', ')}`);
  }

  const films = [...filmMap.values()].filter((f) => f.showtimes.length > 0);
  console.log(`Found ${films.length} films with showtimes for Eye (${allShows.length} total shows fetched)`);
  return { name: 'Eye', films };
}

export { fetchEye };
