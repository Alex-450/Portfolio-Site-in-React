import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fetchAllRssFeeds, RSS_FEED_NAMES } from './scrapers/rss-feeds.mjs';
import { fetchFcHyena } from './scrapers/fc-hyena.mjs';
import { fetchEye } from './scrapers/eye.mjs';
import { fetchKriterion } from './scrapers/kriterion.mjs';
import { toDateStamp } from './scrapers/utils.mjs';
import {
  searchTmdbMovieDetails,
  fetchTmdbMovieDetails,
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
  const [rssResult, fcHyenaResult, eyeResult, kriterionResult] =
    await Promise.allSettled([
      fetchAllRssFeeds(),
      fetchFcHyena(),
      fetchEye(),
      fetchKriterion(),
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

// A slug unique within `usedSlugs`, appending -1, -2, ... on collision.
function uniqueSlug(title, usedSlugs) {
  let slug = generateSlug(title);
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

async function generateFilmsJson(cinemas) {
  const groupedFilms = groupFilmsByCinema(cinemas);
  const resolveDetails = await fetchTmdbForFilms(groupedFilms);

  const filmsIndex = {};
  const usedSlugs = new Set();

  for (const film of groupedFilms) {
    const details = resolveDetails(film);
    const slug = uniqueSlug(film.title, usedSlugs);

    filmsIndex[slug] = {
      slug,
      title: film.title,
      director: film.director || details?.director || null,
      runtime: details?.runtime || film.runtime || null,
      posterUrl: details?.posterPath || film.posterUrl || '',
      tmdb: toTmdbData(details),
      cinemaShowtimes: film.cinemaShowtimes,
    };
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

  const filmsIndex = await generateFilmsJson(allCinemas);

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
