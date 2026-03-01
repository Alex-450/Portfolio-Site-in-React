import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fetchAllRssFeeds } from './scrapers/rss-feeds.mjs';
import { fetchKriterion } from './scrapers/kriterion.mjs';
import { fetchFcHyena } from './scrapers/fc-hyena.mjs';
import { fetchEye } from './scrapers/eye.mjs';
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

async function fetchAllCinemas() {
  // Fetch all sources in parallel
  const [rssResults, kriterionResult, fcHyenaResult, eyeResult] =
    await Promise.allSettled([
      fetchAllRssFeeds(),
      fetchKriterion(),
      fetchFcHyena(),
      fetchEye(),
    ]);

  const cinemas = [];
  const failures = [];

  // Process results
  const namedResults = [
    { name: 'RSS feeds', result: rssResults, isArray: true },
    { name: 'Kriterion', result: kriterionResult },
    { name: 'FC Hyena', result: fcHyenaResult },
    { name: 'Eye', result: eyeResult },
  ];

  for (const { name, result, isArray } of namedResults) {
    if (result.status === 'fulfilled') {
      if (isArray) {
        cinemas.push(...result.value);
      } else if (result.value.films.length > 0) {
        cinemas.push(result.value);
      }
    } else {
      console.error(`Error fetching ${name}:`, result.reason?.message);
      failures.push(name);
    }
  }

  if (failures.length > 0) {
    console.warn(`\nWarning: failed to fetch data from: ${failures.join(', ')}. Continuing with partial data.`);
  }

  if (cinemas.length === 0) {
    throw new Error('All cinema sources failed — cannot build films.json');
  }

  return cinemas;
}

function groupFilmsByCinema(cinemas) {
  const filmMap = new Map();

  for (const cinema of cinemas) {
    for (const film of cinema.films) {
      const key = cleanTitle(film.title);
      const variant = extractVariant(film.title);

      const yearMatch = variant?.match(/\b\d{4}\b/);
      const year = yearMatch ? parseInt(yearMatch[0]) : null;

      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title: getCleanDisplayTitle(film.title),
          director: film.director,
          year,
          runtime: film.runtime,
          posterUrl: film.posterUrl,
          _tmdbId: film._tmdbId,
          cinemaShowtimes: [],
        });
      }

      const existing = filmMap.get(key);
      // Keep better data if available
      const incomingTitle = getCleanDisplayTitle(film.title);
      // Prefer the title with more accented/non-ASCII characters (e.g. L'Étranger > L'Etranger)
      const countAccents = (s) => [...s].filter((c) => c !== c.normalize('NFD').replace(/\p{Diacritic}/gu, '')).length;
      if (countAccents(incomingTitle) > countAccents(existing.title))
        existing.title = incomingTitle;
      if (!existing.director && film.director)
        existing.director = film.director;
      if (!existing.year && year) existing.year = year;
      if (!existing.runtime && film.runtime) existing.runtime = film.runtime;
      if (!existing.posterUrl && film.posterUrl)
        existing.posterUrl = film.posterUrl;
      if (!existing._tmdbId && film._tmdbId) existing._tmdbId = film._tmdbId;

      existing.cinemaShowtimes.push({
        cinema: cinema.name,
        showtimes: film.showtimes,
        variant: variant,
        subtitles: film.subtitles ?? null,
      });
    }
  }

  return Array.from(filmMap.values());
}

async function generateFilmsJson(cinemas) {
  const groupedFilms = groupFilmsByCinema(cinemas);
  const filmsIndex = {};
  const usedSlugs = new Set();

  // Build caches from films that already have data
  const tmdbCacheById = new Map();
  const tmdbCacheByTitle = new Map();

  for (const film of groupedFilms) {
    if (film._tmdbId) {
      tmdbCacheById.set(film._tmdbId, film);
    }
  }

  // Deduplicate: only fetch once per unique tmdbId or cleaned title
  const toFetchById = [];
  const toFetchByTitle = [];
  const seenTitles = new Set();

  for (const film of groupedFilms) {
    const cleaned = cleanTitle(film.title);
    if (film._tmdbId && !tmdbCacheById.get(film._tmdbId)?._fetchedDetails) {
      toFetchById.push(film);
      tmdbCacheById.get(film._tmdbId)._fetchedDetails = 'pending';
    } else if (!film._tmdbId && !seenTitles.has(cleaned)) {
      seenTitles.add(cleaned);
      toFetchByTitle.push(film);
    }
  }

  const totalFetches = toFetchById.length + toFetchByTitle.length;
  console.log(
    `\nFetching TMDB details for ${totalFetches} unique films (${groupedFilms.length} total)...`
  );

  // Combine all fetches and run with concurrency limit
  const allToFetch = [
    ...toFetchById.map((film) => ({ film, byId: true })),
    ...toFetchByTitle.map((film) => ({ film, byId: false })),
  ];

  await mapWithConcurrency(
    allToFetch,
    async ({ film, byId }) => {
      if (byId) {
        const details = await fetchTmdbMovieDetails(film._tmdbId);
        tmdbCacheById.set(film._tmdbId, details);
      } else {
        const details = await searchTmdbMovieDetails(film.title, {
          director: film.director,
          year: film.year,
        });
        tmdbCacheByTitle.set(cleanTitle(film.title), details);
      }
    },
    10
  );

  // Build results using cached data
  for (const film of groupedFilms) {
    const details = film._tmdbId
      ? tmdbCacheById.get(film._tmdbId)
      : tmdbCacheByTitle.get(cleanTitle(film.title));

    // Generate unique slug
    let slug = generateSlug(film.title);
    if (usedSlugs.has(slug)) {
      let counter = 1;
      while (usedSlugs.has(`${slug}-${counter}`)) counter++;
      const newSlug = `${slug}-${counter}`;
      console.warn(`Slug collision: "${slug}" already used — assigning "${newSlug}" to "${film.title}"`);
      slug = newSlug;
    }
    usedSlugs.add(slug);

    filmsIndex[slug] = {
      slug,
      title: film.title,
      director: film.director || details?.director || null,
      runtime: details?.runtime || film.runtime || null,
      posterUrl: details?.posterPath || film.posterUrl || '',
      tmdb: details
        ? {
            id: details.tmdbId,
            overview: details.overview,
            releaseDate: details.releaseDate,
            releaseDateNl: details.releaseDateNl,
            genres: details.genres,
            originalLanguage: details.originalLanguage,
            runtime: details.runtime,
            youtubeTrailerId: details.youtubeTrailerId,
            imdbId: details.imdbId,
            rtId: details.rtId,
            metacriticId: details.metacriticId,
            rtScore: details.rtScore,
            metacriticScore: details.metacriticScore,
            letterboxdId: details.letterboxdId,
          }
        : null,
      cinemaShowtimes: film.cinemaShowtimes,
    };
  }

  return filmsIndex;
}

async function main() {
  const startTime = performance.now();
  const outputPath = 'src/data/films.json';

  try {
    console.log('Fetching showtimes...\n');

    const cinemas = await fetchAllCinemas();

    mkdirSync(dirname(outputPath), { recursive: true });

    // Load existing films to preserve dateAdded
    let existingFilms = {};
    if (existsSync(outputPath)) {
      existingFilms = JSON.parse(readFileSync(outputPath, 'utf-8'));
    }

    // Generate films.json with TMDB details
    const filmsIndex = await generateFilmsJson(cinemas);

    // Preserve dateAdded for existing films, set today's date for new films
    const today = new Date().toISOString().split('T')[0];
    for (const slug of Object.keys(filmsIndex)) {
      if (existingFilms[slug]?.dateAdded) {
        filmsIndex[slug].dateAdded = existingFilms[slug].dateAdded;
      } else {
        filmsIndex[slug].dateAdded = today;
      }
    }

    writeFileSync(outputPath, JSON.stringify(filmsIndex, null, 2));

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\nWrote ${Object.keys(filmsIndex).length} films to ${outputPath}`
    );
    console.log(`Last updated: ${new Date().toISOString()}`);
    console.log(`Total time: ${elapsed}s`);
  } catch (err) {
    console.error('Failed to fetch showtimes:', err.message);

    // Fall back to existing cached file if available
    if (existsSync(outputPath)) {
      console.log(`\nUsing existing cached ${outputPath}`);
      const cached = JSON.parse(readFileSync(outputPath, 'utf-8'));
      console.log(`Cached file contains ${Object.keys(cached).length} films`);
    } else {
      console.error('No cached file available, build cannot continue');
      process.exit(1);
    }
  }
}

main();
