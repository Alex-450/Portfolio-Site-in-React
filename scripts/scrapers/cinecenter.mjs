import {
  fetchWithRetry,
  decodeAndTrim,
  finalizeFilms,
  normalizeSubtitles,
} from './utils.mjs';

// Cinecenter (Amsterdam arthouse) runs an Astro site backed by the Tricket
// ticketing platform. There is no public Tricket listing API — the schedule is
// fetched server-side and rendered into the homepage as the serialized props of
// a `<astro-island>` (the DailyGridSchedule component). Those props carry the
// FULL upcoming programme inline (every production plus its screenings, with
// director, cast, runtime, subtitle language and a ticket URL), so a single
// homepage fetch is all we need — no pagination, no per-film detail pages.
const CINECENTER_URL = 'https://www.cinecenter.nl/';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Astro serializes island props as HTML-entity-escaped JSON where every value is
// wrapped in a [type, value] tuple (0 = plain, 1/2 = array, 3 = Date). Undo the
// entity escaping and recursively unwrap the tuples back into plain JSON.
function decodeAstroProps(escaped) {
  const json = escaped
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  return unwrapAstro(JSON.parse(json));
}

function unwrapAstro(node) {
  if (Array.isArray(node)) {
    // A [type, value] tuple has a leading numeric type tag.
    if (node.length === 2 && typeof node[0] === 'number') {
      const [type, value] = node;
      if (type === 1 || type === 2) return value.map(unwrapAstro); // array
      if (type === 3) return value; // Date — keep the ISO string
      return value && typeof value === 'object' ? unwrapAstro(value) : value;
    }
    return node.map(unwrapAstro);
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) out[key] = unwrapAstro(node[key]);
    return out;
  }
  return node;
}

// Pull the DailyGridSchedule island's props out of the homepage HTML. Returns
// the decoded object ({ productions, ... }) or null if the island is missing.
function extractSchedule(html) {
  for (const [, props] of html.matchAll(
    /<astro-island\b[^>]*\bprops="([^"]*)"[^>]*>/g
  )) {
    if (props.includes('screenings')) return decodeAstroProps(props);
  }
  return null;
}

// Cinecenter prefixes some titles with a screening-type label that isn't part
// of the film's name: a subtitle hint ("Eng Subs: Calle Malaga", which just
// duplicates the structured `subtitle` field) or a programme label ("Preview:",
// "LGBTQ+ Preview:"). Strip a known label prefix so the title groups with the
// same film elsewhere. This is a fixed vocabulary, not a free-form prefix strip,
// so real "Prefix: Title" names aren't harmed.
const LABEL_PREFIX =
  /^((eng?|ned|nl|dutch|english)\s*subs?|(lgbtq\+?\s*)?preview|q&a|marathon)$/i;

function stripLabelPrefix(title) {
  const colon = title.indexOf(':');
  if (colon === -1) return title;
  const prefix = title.slice(0, colon).trim();
  return LABEL_PREFIX.test(prefix) ? title.slice(colon + 1).trim() : title;
}

// Cinecenter's subtitle field is a locale code ("en-US", "nl-NL") or a language
// name ("Nederlands"); normalize the locale codes to a bare language first so
// the shared normalizer recognizes them.
function subtitleCode(subtitle) {
  if (!subtitle) return null;
  const token = subtitle.toLowerCase().split(/[-_]/)[0];
  return normalizeSubtitles(token);
}

// UTC ISO timestamp -> { date: "YYYY-MM-DD", time: "HH:MM" } in Amsterdam time.
function toLocalDateTime(startAtUtc) {
  const dt = new Date(startAtUtc);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const hour = get('hour') === '24' ? '00' : get('hour');
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`,
  };
}

async function fetchCinecenter() {
  console.log('Fetching Cinecenter...');

  const response = await fetchWithRetry(CINECENTER_URL, {
    headers: BROWSER_HEADERS,
  });
  const html = await response.text();

  const schedule = extractSchedule(html);
  if (!schedule?.productions) {
    console.warn('Cinecenter: no schedule island found in homepage');
    return { name: 'Cinecenter', films: [] };
  }

  const filmMap = new Map();
  let totalScreenings = 0;

  for (const production of schedule.productions) {
    const title = stripLabelPrefix(decodeAndTrim(production.title));
    if (!title) continue;

    for (const screening of production.screenings ?? []) {
      if (!screening.startAtUtc) continue;
      totalScreenings++;

      // Separate subtitle variants into their own group so each renders its own
      // badge, matching how the other scrapers key films.
      const subtitles = subtitleCode(production.subtitle);
      const key = `${production.id}-${subtitles ?? ''}`;
      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title,
          director: production.directedBy || null,
          runtime: production.durationInMinutes || null,
          posterUrl: production.thumbnail || '',
          subtitles,
          showtimes: [],
        });
      }

      const { date, time } = toLocalDateTime(screening.startAtUtc);
      filmMap.get(key).showtimes.push({
        date,
        time,
        ticketUrl: screening.url || '',
        screen: screening.hallName || '',
      });
    }
  }

  return finalizeFilms(
    filmMap,
    'Cinecenter',
    ` (${totalScreenings} total screenings)`
  );
}

export { fetchCinecenter };
