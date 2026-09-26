import {
  fetchWithRetry,
  decodeAndTrim,
  finalizeFilms,
  normalizeSubtitles,
} from './utils.mjs';

// Flora Filmtheater (Den Haag) runs a Statamic site with no public API — its
// REST and GraphQL surfaces are disabled and the ticketing backend (Ticketlab)
// offers no export. The film pages do embed schema.org `ScreeningEvent` blocks
// as JSON-LD, one per screening, carrying a full ISO timestamp, the ticket URL
// and the film's director, runtime and release year. That's structured data
// rather than markup, so we parse those instead of scraping the agenda HTML
// (which only renders abbreviated Dutch dates with no year).
//
// The agenda lists every film currently programmed; each film page then yields
// its own screenings. One request for the agenda plus one per film.
const AGENDA_URL = 'https://florafilmtheater.nl/agenda';
const SITE_ORIGIN = 'https://florafilmtheater.nl';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
};

// Fetch at most this many film pages concurrently, to stay polite to a small
// cinema's server.
const CONCURRENCY = 5;

// Every `<script type="application/ld+json">` block on a page, parsed. A block
// that doesn't parse is skipped rather than failing the whole page.
function parseJsonLd(html) {
  const blocks = [];
  for (const [, body] of html.matchAll(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g
  )) {
    try {
      blocks.push(JSON.parse(body));
    } catch {
      // Malformed block — ignore it and keep the others.
    }
  }
  return blocks;
}

// ISO 8601 duration ("PT98M", "PT2H5M") -> whole minutes, or null.
function parseIsoDuration(duration) {
  const match = String(duration ?? '').match(
    /^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?/
  );
  if (!match) return null;
  const minutes =
    (parseInt(match[1] ?? '0', 10) || 0) * 60 +
    (parseInt(match[2] ?? '0', 10) || 0);
  return minutes || null;
}

// "2026-10-04T12:45:00+02:00" -> { date: "2026-10-04", time: "12:45" }. The
// offset is the cinema's own local time, so the leading date and time are
// already what we want — no timezone conversion needed.
function splitLocalTimestamp(startDate) {
  const match = String(startDate ?? '').match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/
  );
  return match ? { date: match[1], time: match[2] } : null;
}

// Flora has no subtitle field in its JSON-LD; the title carries the hint
// instead ("Akira (1988) - EN subs"). Titles with no marker are Dutch-language
// or unannotated, which we report as unknown rather than guessing.
function subtitlesFromTitle(title) {
  const match = title.match(/\b(EN|NL|Eng|Ned|English|Nederlands)\s*subs?\b/i);
  return match ? normalizeSubtitles(match[1]) : null;
}

// "1996-01-01" -> 1996. Flora stores a release year as a January-1st date.
function yearFromDateCreated(dateCreated) {
  const match = String(dateCreated ?? '').match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

// Collect the /film/<slug> links the agenda page lists.
function extractFilmPaths(html) {
  const paths = new Set();
  for (const [, path] of html.matchAll(/href="(\/film\/[a-z0-9-]+)"/gi)) {
    paths.add(path);
  }
  return [...paths];
}

// Turn one film page into a { key -> film } map of its screenings. A page can
// yield more than one entry when screenings differ by subtitle variant.
function parseFilmPage(html, filmMap) {
  for (const block of parseJsonLd(html)) {
    if (block['@type'] !== 'ScreeningEvent') continue;

    const when = splitLocalTimestamp(block.startDate);
    if (!when) continue;

    const movie = block.workPresented ?? {};
    // `workPresented.name` is the film's own title; the event's own `name`
    // appends the screening date ("Akira (1988) - EN subs - 28 september ...").
    const title = decodeAndTrim(movie.name);
    if (!title) continue;

    // Separate subtitle variants into their own group so each renders its own
    // badge, matching how the other scrapers key films.
    const subtitles = subtitlesFromTitle(title);
    const key = `${title}-${subtitles ?? ''}`;

    if (!filmMap.has(key)) {
      filmMap.set(key, {
        title,
        director: decodeAndTrim(movie.director?.name) || null,
        runtime: parseIsoDuration(movie.duration),
        year: yearFromDateCreated(movie.dateCreated),
        posterUrl: movie.image || '',
        subtitles,
        showtimes: [],
      });
    }

    filmMap.get(key).showtimes.push({
      date: when.date,
      time: when.time,
      ticketUrl: block.offers?.url || '',
      // Flora's JSON-LD names the venue, not the individual screen.
      screen: '',
    });
  }
}

async function fetchFlora() {
  console.log('Fetching Flora Filmtheater...');

  const agendaResponse = await fetchWithRetry(AGENDA_URL, {
    headers: BROWSER_HEADERS,
  });
  const paths = extractFilmPaths(await agendaResponse.text());

  if (paths.length === 0) {
    console.warn('Flora Filmtheater: no film links found on the agenda');
    return { name: 'Flora Filmtheater', films: [] };
  }

  const filmMap = new Map();
  let failedPages = 0;

  // Fetch the film pages in small batches rather than all at once.
  for (let i = 0; i < paths.length; i += CONCURRENCY) {
    const batch = paths.slice(i, i + CONCURRENCY);
    const pages = await Promise.allSettled(
      batch.map(async (path) => {
        const response = await fetchWithRetry(`${SITE_ORIGIN}${path}`, {
          headers: BROWSER_HEADERS,
        });
        return response.text();
      })
    );

    for (const [index, page] of pages.entries()) {
      if (page.status === 'fulfilled') {
        parseFilmPage(page.value, filmMap);
      } else {
        // One unreachable film page shouldn't lose the whole cinema.
        failedPages++;
        console.warn(
          `  Flora: failed to fetch ${batch[index]} — ${page.reason?.message ?? page.reason}`
        );
      }
    }
  }

  return finalizeFilms(
    filmMap,
    'Flora Filmtheater',
    ` (${paths.length - failedPages}/${paths.length} film pages)`
  );
}

export { fetchFlora };
