import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fetchAllRssFeeds, RSS_FEED_NAMES } from './scrapers/rss-feeds.mjs';
import { fetchFcHyena } from './scrapers/fc-hyena.mjs';
import { fetchEye } from './scrapers/eye.mjs';
import { fetchKriterion } from './scrapers/kriterion.mjs';
import { fetchRialto } from './scrapers/rialto.mjs';
import { fetchGriffioen } from './scrapers/griffioen.mjs';
import { fetchCinecenter } from './scrapers/cinecenter.mjs';
import { fetchFilmhuisDenHaag } from './scrapers/filmhuis-den-haag.mjs';
import { fetchFlora } from './scrapers/flora.mjs';
import { toDateStamp } from './scrapers/utils.mjs';
import {
  searchTmdbMovieDetails,
  fetchTmdbMovieDetails,
  flushWikidata,
} from './scrapers/tmdb.mjs';
import {
  cleanTitle,
  generateSlug,
  extractVariant,
  getCleanDisplayTitle,
} from '../src/utils/filmTitle.mjs';

// Run async functions with limited concurrency
async function mapWithConcurrency(items, fn, concurrency = 10) {
  const results = [];
  const executing = new Set();

  for (const [index, item] of items.entries()) {
    const promise = fn(item, index).then((result) => {
      executing.delete(promise);
      return result;
    });
    results.push(promise);
    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// Returns { cinemas, failedCinemaNames }
async function fetchAllCinemas() {
  // Fetch all sources in parallel
  const [
    rssResult,
    fcHyenaResult,
    eyeResult,
    kriterionResult,
    rialtoResult,
    griffioenResult,
    cinecenterResult,
    filmhuisDenHaagResult,
    floraResult,
  ] = await Promise.allSettled([
    fetchAllRssFeeds(),
    fetchFcHyena(),
    fetchEye(),
    fetchKriterion(),
    fetchRialto(),
    fetchGriffioen(),
    fetchCinecenter(),
    fetchFilmhuisDenHaag(),
    fetchFlora(),
  ]);

  const cinemas = [];
  const failedCinemaNames = [];

  // Process results
  if (rssResult.status === 'fulfilled') {
    cinemas.push(...rssResult.value.cinemas);
    failedCinemaNames.push(...rssResult.value.failedCinemaNames);
  } else {
    console.error(`Error fetching RSS feeds:`);
    console.error(rssResult.reason);
    failedCinemaNames.push(...RSS_FEED_NAMES);
  }

  const namedResults = [
    { name: 'FC Hyena', result: fcHyenaResult },
    { name: 'Eye Filmmuseum', result: eyeResult },
    { name: 'Kriterion', result: kriterionResult },
    { name: 'Rialto VU', result: griffioenResult },
    { name: 'Cinecenter', result: cinecenterResult },
    { name: 'Filmhuis Den Haag', result: filmhuisDenHaagResult },
    { name: 'Flora Filmtheater', result: floraResult },
  ];

  for (const { name, result } of namedResults) {
    if (result.status === 'fulfilled') {
      if (result.value.films.length > 0) cinemas.push(result.value);
    } else {
      console.error(`Error fetching ${name}:`);
      console.error(result.reason);
      failedCinemaNames.push(name);
    }
  }

  // Rialto returns multiple venues (one { name, films } per location).
  // (Rialto VU has its own source — see fetchGriffioen above.)
  const RIALTO_VENUE_NAMES = ['Rialto De Pijp', 'Rialto Silo'];
  if (rialtoResult.status === 'fulfilled') {
    for (const venue of rialtoResult.value) {
      if (venue.films.length > 0) cinemas.push(venue);
    }
  } else {
    console.error('Error fetching Rialto:');
    console.error(rialtoResult.reason);
    failedCinemaNames.push(...RIALTO_VENUE_NAMES);
  }

  if (cinemas.length === 0) {
    throw new Error('All cinema sources failed — cannot build films.json');
  }

  const totalCinemas = cinemas.length + failedCinemaNames.length;
  if (failedCinemaNames.length > totalCinemas / 2) {
    throw new Error(
      `${failedCinemaNames.length}/${totalCinemas} cinema sources failed — refusing to build with mostly stale data: ${failedCinemaNames.join(', ')}`
    );
  }

  return { cinemas, failedCinemaNames };
}

// Reconstruct cinema objects from existing films.json for cinemas that failed to scrape
function buildFallbackCinemas(existingFilms, failedCinemaNames) {
  if (failedCinemaNames.length === 0) return [];

  const failedSet = new Set(failedCinemaNames);
  const cinemaFilmsMap = new Map(); // cinemaName -> films[]

  for (const film of Object.values(existingFilms)) {
    for (const cs of film.cinemaShowtimes ?? []) {
      if (!failedSet.has(cs.cinema)) continue;
      if (!cinemaFilmsMap.has(cs.cinema)) cinemaFilmsMap.set(cs.cinema, []);
      cinemaFilmsMap.get(cs.cinema).push({
        title: film.title,
        director: film.director,
        runtime: film.runtime,
        posterUrl: film.posterUrl,
        _tmdbId: film.tmdb?.id ?? null,
        year: film.tmdb?.releaseDate ? parseInt(film.tmdb.releaseDate) : null,
        showtimes: cs.showtimes,
        subtitles: cs.subtitles,
        variant: cs.variant,
      });
    }
  }

  return [...cinemaFilmsMap.entries()].map(([name, films]) => {
    console.warn(`Warning: using cached data for ${name} (scrape failed)`);
    return { name, films };
  });
}

// Number of accented/non-ASCII characters in a string — used to prefer the
// richer spelling of a title (e.g. "L'Étranger" over "L'Etranger").
const countAccents = (s) =>
  [...s].filter((c) => c !== c.normalize('NFD').replace(/\p{Diacritic}/gu, ''))
    .length;

// Fill in any fields the grouped film is still missing from a new screening of
// the same film, and upgrade the title if this copy has richer accents.
function mergeFilmData(existing, film, incomingTitle, year) {
  if (countAccents(incomingTitle) > countAccents(existing.title))
    existing.title = incomingTitle;
  existing.director ||= film.director;
  existing.year ||= year;
  existing.runtime ||= film.runtime;
  existing.posterUrl ||= film.posterUrl;
  existing._tmdbId ||= film._tmdbId;
  existing._originalTitle ||= film._originalTitle;
}

// The release year for a screening: an explicit "(YYYY)" variant wins over the
// scraper-provided year.
function resolveYear(variant, film) {
  const yearMatch = variant?.match(/\b\d{4}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : (film.year ?? null);
}

// Collapse screenings from all cinemas into one entry per film (keyed by cleaned
// title), merging metadata and collecting each cinema's showtimes.
function groupFilmsByCinema(cinemas) {
  const filmMap = new Map();

  for (const cinema of cinemas) {
    for (const film of cinema.films) {
      const key = cleanTitle(film.title);
      const variant = extractVariant(film.title);
      const year = resolveYear(variant, film);
      const incomingTitle = getCleanDisplayTitle(film.title);

      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title: incomingTitle,
          director: film.director,
          year,
          runtime: film.runtime,
          posterUrl: film.posterUrl,
          _tmdbId: film._tmdbId,
          _originalTitle: film._originalTitle ?? null,
          cinemaShowtimes: [],
        });
      } else {
        mergeFilmData(filmMap.get(key), film, incomingTitle, year);
      }

      filmMap.get(key).cinemaShowtimes.push({
        cinema: cinema.name,
        showtimes: film.showtimes,
        variant,
        subtitles: film.subtitles ?? null,
      });
    }
  }

  return Array.from(filmMap.values());
}

// Fetch TMDB details for every grouped film, deduplicating so each unique
// tmdbId or cleaned title is only fetched once. Returns a lookup: given a film,
// it resolves to that film's TMDB details (or null).
async function fetchTmdbForFilms(groupedFilms) {
  const byId = new Map();
  const byTitle = new Map();

  // Films with a known tmdbId are fetched once per id; the rest once per title.
  const idsToFetch = new Set();
  const titlesToFetch = new Map(); // cleanedTitle -> film
  for (const film of groupedFilms) {
    if (film._tmdbId) {
      idsToFetch.add(film._tmdbId);
    } else {
      const cleaned = cleanTitle(film.title);
      if (!titlesToFetch.has(cleaned)) titlesToFetch.set(cleaned, film);
    }
  }

  console.log(
    `\nFetching TMDB details for ${idsToFetch.size + titlesToFetch.size} unique films (${groupedFilms.length} total)...`
  );

  const tasks = [
    ...[...idsToFetch].map((id) => async () => {
      byId.set(id, await fetchTmdbMovieDetails(id));
    }),
    ...[...titlesToFetch].map(([cleaned, film]) => async () => {
      byTitle.set(
        cleaned,
        await searchTmdbMovieDetails(film.title, {
          director: film.director,
          year: film.year,
          originalTitle: film._originalTitle,
        })
      );
    }),
  ];
  await mapWithConcurrency(tasks, (task) => task(), 10);

  // Wikidata runs only now that every TMDB lookup is done, so its rate-limited
  // requests never sit in the critical path of the TMDB fan-out.
  await flushWikidata();

  return (film) =>
    film._tmdbId ? byId.get(film._tmdbId) : byTitle.get(cleanTitle(film.title));
}

// Project TMDB details (buildResult's shape) onto the public TmdbData object,
// or null. Field list lives here so adding a TMDB field is a one-line change.
function toTmdbData(details) {
  if (!details) return null;
  const { tmdbId, director, posterPath, ...rest } = details;
  return { id: tmdbId, ...rest };
}

// Reserve `slug` in `usedSlugs`, appending -1, -2, ... if it's taken. `title`
// is only used to make the collision warning readable.
function uniqueSlug(slug, title, usedSlugs) {
  if (usedSlugs.has(slug)) {
    let counter = 1;
    while (usedSlugs.has(`${slug}-${counter}`)) counter++;
    const next = `${slug}-${counter}`;
    console.warn(
      `Slug collision: "${slug}" already used — assigning "${next}" to "${title}"`
    );
    slug = next;
  }
  usedSlugs.add(slug);
  return slug;
}

// Merge films that resolved to the same TMDB id. Grouping in
// groupFilmsByCinema() keys on the cleaned title, so one film listed under two
// titles stays split — a Dutch/English pair ("Het Vergeten Eiland" /
// "The Forgotten Island"), a programme label ("Coward - First Pick"), or a
// post-screening talk ("De Manager + nagesprek"). Once TMDB has resolved them
// they're provably the same film, so their showtimes belong on one entry.
//
// Runs before slugs are assigned, so a title that gets merged away never
// reserves a slug (which previously reported a bogus collision for it).
//
// Films with no TMDB id are never merged: without an id there's no evidence
// they're the same film, and titles alone are not enough.
function dedupeByTmdbId(films, existingFilms) {
  const byId = new Map();
  const unidentified = [];

  for (const film of films) {
    const id = film.tmdb?.id;
    if (!id) {
      unidentified.push(film);
      continue;
    }
    const seen = byId.get(id);
    if (seen) {
      mergeDuplicate(seen, film, existingFilms);
    } else {
      byId.set(id, film);
    }
  }

  return [...byId.values(), ...unidentified];
}

// Fold `dup` into `keep`, concatenating showtimes. Title and slug are decided
// separately, because they answer different questions: the title is what
// readers see, so it should be the plainest of the two — programme labels,
// "(incl. ...)" notes and talk-back suffixes all make a title longer, so the
// shorter one wins. The slug is a URL, so an already-published one wins to keep
// existing links and dateAdded stable; failing that it follows the title.
function mergeDuplicate(keep, dup, existingFilms) {
  const plainest = dup.title.length < keep.title.length ? dup : keep;
  const published = [keep, dup].filter((f) => existingFilms?.[f.slug]);
  const slugFrom = published.length === 1 ? published[0] : plainest;

  console.log(
    `Merged duplicate of TMDB ${keep.tmdb.id}: ${JSON.stringify(dup.title)} -> ${JSON.stringify(plainest.title)} (${slugFrom.slug})`
  );

  keep.title = plainest.title;
  keep.slug = slugFrom.slug;
  keep.director ||= dup.director;
  keep.runtime ||= dup.runtime;
  keep.posterUrl ||= dup.posterUrl;
  keep.cinemaShowtimes.push(...dup.cinemaShowtimes);
}

async function generateFilmsJson(cinemas, existingFilms = {}) {
  const groupedFilms = groupFilmsByCinema(cinemas);
  const resolveDetails = await fetchTmdbForFilms(groupedFilms);

  // Shape each film with its TMDB details, carrying the slug it would prefer so
  // de-duping can favour one that's already published.
  const films = groupedFilms.map((film) => {
    const details = resolveDetails(film);
    return {
      slug: generateSlug(film.title),
      title: film.title,
      director: film.director || details?.director || null,
      runtime: details?.runtime || film.runtime || null,
      posterUrl: details?.posterPath || film.posterUrl || '',
      tmdb: toTmdbData(details),
      cinemaShowtimes: film.cinemaShowtimes,
    };
  });

  // De-dupe first, then assign final slugs: only surviving films should reserve
  // one, so collisions are reported for real clashes rather than merged-away
  // duplicates.
  const filmsIndex = {};
  const usedSlugs = new Set();
  for (const film of dedupeByTmdbId(films, existingFilms)) {
    film.slug = uniqueSlug(film.slug, film.title, usedSlugs);
    filmsIndex[film.slug] = film;
  }

  return filmsIndex;
}

async function main() {
  const startTime = performance.now();
  const outputPath = 'src/data/films.json';

  console.log('Fetching showtimes...\n');

  mkdirSync(dirname(outputPath), { recursive: true });

  const existingFilms = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, 'utf-8'))
    : {};

  const { cinemas, failedCinemaNames } = await fetchAllCinemas();

  const fallbackCinemas = buildFallbackCinemas(
    existingFilms,
    failedCinemaNames
  );
  const allCinemas = [...cinemas, ...fallbackCinemas];

  const filmsIndex = await generateFilmsJson(allCinemas, existingFilms);

  // Preserve dateAdded for existing films, set today's date for new films
  const today = toDateStamp();
  for (const slug of Object.keys(filmsIndex)) {
    filmsIndex[slug].dateAdded = existingFilms[slug]?.dateAdded ?? today;
  }

  writeFileSync(outputPath, JSON.stringify(filmsIndex, null, 2));

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(
    `\nWrote ${Object.keys(filmsIndex).length} films to ${outputPath}`
  );
  console.log(`Last updated: ${new Date().toISOString()}`);
  console.log(`Total time: ${elapsed}s`);

  for (const name of failedCinemaNames) {
    console.log(`::warning::Scraper failed for ${name} — using cached data`);
  }

  // Write failed cinemas to a file so the CI workflow can notify
  if (failedCinemaNames.length > 0) {
    writeFileSync('failed-cinemas.txt', failedCinemaNames.join('\n'));
  }
}

main().catch((err) => {
  console.error('Failed to fetch showtimes:', err.message);
  process.exit(1);
});
