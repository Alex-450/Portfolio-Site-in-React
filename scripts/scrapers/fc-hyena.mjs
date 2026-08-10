import {
  fetchWithRetry,
  decodeAndTrim,
  finalizeFilms,
  normalizeSubtitles,
  parseFilmLength,
  parseEventDateTime,
} from './utils.mjs';

const TICKETS_BASE = 'https://tickets.fchyena.nl/fchyena/en/flow_configs/1';
const EVENTS_LIST_URL = `${TICKETS_BASE}/z_events_list`;
const TICKET_URL_BASE =
  'https://tickets.fchyena.nl/fchyena/en/flow_configs/fchy_1s/steps/start/show';
const FC_HYENA_HOME = 'https://fchyena.nl/';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

function parseEventRows(html) {
  const rows = [];
  for (const [, row] of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
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

function extractProductionIds(html) {
  return [
    ...new Set([...html.matchAll(/production_id=(\d+)/g)].map((m) => m[1])),
  ];
}

function parseSearchIndex(index) {
  const byProductionId = new Map();

  for (const [path, page] of Object.entries(index ?? {})) {
    const productionId = path.match(/^\/films\/(\d+)$/)?.[1];
    if (!productionId) continue;

    const paragraphs = Array.isArray(page?.p) ? page.p : [];
    const valueAfter = (label) => {
      const i = paragraphs.indexOf(label);
      return i === -1 ? null : (paragraphs[i + 1] ?? null);
    };

    const title = Array.isArray(page?.h2) ? page.h2[0] : null;

    byProductionId.set(productionId, {
      title: title ? decodeAndTrim(title) : null,
      director: valueAfter('Director')
        ? decodeAndTrim(valueAfter('Director'))
        : null,
      runtime: parseFilmLength(valueAfter('Duration')),
      subtitles: subtitlesFromLanguage(valueAfter('Language')),
    });
  }

  return byProductionId;
}

function subtitlesFromLanguage(language) {
  if (!language) return null;
  const clauses = String(language).split(/[,;]/);
  for (const clause of clauses) {
    if (!/ondertitel|subtitle/i.test(clause)) continue;
    if (/\bgeen\b|\bno\b/i.test(clause)) return 'none';
    const subtitles = normalizeSubtitles(clause.trim());
    if (subtitles) return subtitles;
  }
  return null;
}

function extractPosters(html) {
  const posters = new Map();
  const imagePattern =
    /"(https:\/\/framerusercontent\.com\/images\/[^"?]+[^"]*)"/g;
  const images = [...html.matchAll(imagePattern)].map((m) => ({
    index: m.index,
    url: m[1],
  }));

  for (const match of html.matchAll(/production_id=(\d+)/g)) {
    const productionId = match[1];
    if (posters.has(productionId)) continue;
    let nearest = null;
    for (const image of images) {
      if (image.index > match.index) break;
      nearest = image;
    }
    if (nearest) posters.set(productionId, nearest.url.split(' ')[0]);
  }

  return posters;
}

async function fetchHtml(url) {
  const response = await fetchWithRetry(url, { headers: BROWSER_HEADERS });
  return response.text();
}

async function fetchSiteMetadata(homeHtml) {
  const indexUrl = homeHtml.match(
    /<meta\s+name="framer-search-index"\s+content="([^"]+)"/
  )?.[1];
  if (!indexUrl) {
    console.warn('  FC Hyena: no search index on homepage — skipping metadata');
    return new Map();
  }

  try {
    const response = await fetchWithRetry(indexUrl, {
      headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
    });
    return parseSearchIndex(await response.json());
  } catch (err) {
    console.warn(`  FC Hyena: could not read search index: ${err.message}`);
    return new Map();
  }
}

async function fetchShowToProduction(productionIds) {
  const showToProduction = new Map();

  const lists = await Promise.allSettled(
    productionIds.map(async (productionId) => ({
      productionId,
      html: await fetchHtml(`${EVENTS_LIST_URL}?production_id=${productionId}`),
    }))
  );

  for (const list of lists) {
    if (list.status !== 'fulfilled') {
      console.warn(
        `  FC Hyena: production list failed: ${list.reason.message}`
      );
      continue;
    }
    for (const { showId } of parseEventRows(list.value.html)) {
      showToProduction.set(showId, list.value.productionId);
    }
  }

  return showToProduction;
}

async function fetchFcHyena() {
  console.log('Fetching FC Hyena...');

  const eventsHtml = await fetchHtml(EVENTS_LIST_URL);
  const shows = parseEventRows(eventsHtml);
  if (shows.length === 0) {
    throw new Error('FC Hyena: no shows found in ticketing event list');
  }

  let metadata = new Map();
  let posters = new Map();
  let showToProduction = new Map();
  try {
    const homeHtml = await fetchHtml(FC_HYENA_HOME);
    const productionIds = extractProductionIds(homeHtml);
    posters = extractPosters(homeHtml);
    [metadata, showToProduction] = await Promise.all([
      fetchSiteMetadata(homeHtml),
      fetchShowToProduction(productionIds),
    ]);
  } catch (err) {
    console.warn(`  FC Hyena: metadata unavailable: ${err.message}`);
  }

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Amsterdam',
  });

  const filmMap = new Map();
  let skippedPast = 0;

  for (const show of shows) {
    if (show.date < today) {
      skippedPast++;
      continue;
    }

    const productionId = showToProduction.get(show.showId);
    const details = productionId ? metadata.get(productionId) : null;

    const key = productionId ?? show.title;
    if (!filmMap.has(key)) {
      filmMap.set(key, {
        title: details?.title || show.title,
        director: details?.director ?? null,
        runtime: details?.runtime ?? null,
        posterUrl: (productionId && posters.get(productionId)) || '',
        subtitles: details?.subtitles ?? null,
        showtimes: [],
      });
    }

    filmMap.get(key).showtimes.push({
      date: show.date,
      time: show.time,
      ticketUrl: `${TICKET_URL_BASE}/${show.showId}`,
      screen: '',
    });
  }

  const withMetadata = [...filmMap.values()].filter((f) => f.director).length;
  return finalizeFilms(
    filmMap,
    'FC Hyena',
    ` (${withMetadata} with metadata${skippedPast ? `, ${skippedPast} past shows skipped` : ''})`
  );
}

export { fetchFcHyena };
