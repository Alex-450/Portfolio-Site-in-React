import { fetchWithRetry, decodeAndTrim, parseFilmLength } from './utils.mjs';

const EYE_URL = 'https://service.eyefilm.nl/graphql';

// Eye uses UUIDs for subtitle languages - map known ones
const SUBTITLE_MAP = {
  '42c27a5b-2d4e-4195-b547-cb6fbe9fcd49': 'EN', // English subtitles
  '41ad8fc8-2c17-46fd-9094-fb3d4a2884fa': 'NL', // Dutch subtitles
  '6e5a13f9-22d0-401c-a5e9-7d3b14578eaf': null, // No subtitles (silent/English films)
  '85c205e1-8eb2-4ae3-8062-9c36ddf9a780': null, // UND — subtitles undetermined
};

const PAGE_SIZE = 200;

async function fetchEyePage(today) {
  const query = `query shows($site: String!, $startDateTime: String, $limit: Int, $sort: ShowSortEnum) {
    shows: show(site: $site, startDateTime: $startDateTime, limit: $limit, sort: $sort) {
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
        limit: PAGE_SIZE,
        sort: 'DATE',
      },
      operationName: 'shows',
    }),
  });

  const data = await response.json();
  return data.data?.shows || [];
}

async function fetchProductionMetadata(productionId) {
  const url = `https://www.eyefilm.nl/en/whats-on/${productionId}`;
  try {
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    const pairs = {};
    for (const [, label, value] of html.matchAll(
      /<h2[^>]*>([^<]+)<\/h2><p[^>]*>([^<]*)<\/p>/g
    )) {
      pairs[label.trim()] = value.trim();
    }
    return {
      director: pairs['Director'] || null,
      year: pairs['Production year'] ? parseInt(pairs['Production year'], 10) : null,
      runtime: pairs['Length'] ? parseFilmLength(pairs['Length']) : null,
      originalTitle: pairs['Original title'] || null,
    };
  } catch {
    return { director: null, year: null, runtime: null };
  }
}

async function fetchEye() {
  console.log('Fetching Eye...');

  const today = new Date().toISOString().split('T')[0];

  const allShows = [];
  const page = await fetchEyePage(today);
  allShows.push(...page);

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
        _eyeProductionId: production.id, // used below to fetch production page metadata
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

  // Fetch director/year/runtime from production pages for unique productions
  const uniqueProductions = new Map();
  for (const film of filmMap.values()) {
    if (!uniqueProductions.has(film._eyeProductionId)) {
      uniqueProductions.set(film._eyeProductionId, film);
    }
  }

  console.log(`Fetching Eye production metadata for ${uniqueProductions.size} unique films...`);
  await Promise.all(
    [...uniqueProductions.entries()].map(async ([productionId, film]) => {
      const meta = await fetchProductionMetadata(productionId);
      film.director = meta.director;
      film.runtime = meta.runtime;
      film.year = meta.year;
      film._originalTitle = meta.originalTitle;
    })
  );

  const films = [...filmMap.values()].filter((f) => f.showtimes.length > 0);
  console.log(`Found ${films.length} films with showtimes for Eye (${allShows.length} total shows fetched)`);
  return { name: 'Eye', films };
}

export { fetchEye };
