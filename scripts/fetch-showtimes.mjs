import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fetchAllRssFeeds } from './scrapers/rss-feeds.mjs';
import { fetchKriterion } from './scrapers/kriterion.mjs';
import { fetchFcHyena } from './scrapers/fc-hyena.mjs';
import { fetchEye } from './scrapers/eye.mjs';
import { searchTmdbMovieDetails, fetchTmdbMovieDetails } from './scrapers/tmdb.mjs';
import { cleanTitle, generateSlug, extractVariant, getCleanDisplayTitle } from '../src/utils/filmTitle.mjs';

// Run async functions with limited concurrency
async function mapWithConcurrency(items, fn, concurrency = 10) {
  const results = [];
  const executing = new Set();

  for (const [index, item] of items.entries()) {
    const promise = fn(item, index).then(result => {
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
  const [rssResults, kriterionResult, fcHyenaResult, eyeResult] = await Promise.allSettled([
    fetchAllRssFeeds(),
    fetchKriterion(),
    fetchFcHyena(),
    fetchEye(),
  ]);

  const cinemas = [];

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
    }
  }

  return cinemas;
}

function groupFilmsByCinema(cinemas) {
  const filmMap = new Map();

  for (const cinema of cinemas) {
    for (const film of cinema.films) {
      const key = cleanTitle(film.title);
      const variant = extractVariant(film.title);

      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title: getCleanDisplayTitle(film.title),
          director: film.director,
          length: film.length,
          posterUrl: film.posterUrl,
          _tmdbId: film._tmdbId,
          cinemaShowtimes: [],
        });
      }

      const existing = filmMap.get(key);
      // Keep better data if available
      if (!existing.director && film.director) existing.director = film.director;
      if (!existing.length && film.length) existing.length = film.length;
      if (!existing.posterUrl && film.posterUrl) existing.posterUrl = film.posterUrl;
      if (!existing._tmdbId && film._tmdbId) existing._tmdbId = film._tmdbId;

      existing.cinemaShowtimes.push({
        cinema: cinema.name,
        showtimes: film.showtimes,
        variant: variant,
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
  console.log(`\nFetching TMDB details for ${totalFetches} unique films (${groupedFilms.length} total)...`);

  // Combine all fetches and run with concurrency limit
  const allToFetch = [
    ...toFetchById.map(film => ({ film, byId: true })),
    ...toFetchByTitle.map(film => ({ film, byId: false })),
  ];

  await mapWithConcurrency(allToFetch, async ({ film, byId }) => {
    if (byId) {
      const details = await fetchTmdbMovieDetails(film._tmdbId);
      tmdbCacheById.set(film._tmdbId, details);
    } else {
      const details = await searchTmdbMovieDetails(film.title);
      tmdbCacheByTitle.set(cleanTitle(film.title), details);
    }
  }, 10);

  // Build results using cached data
  for (const film of groupedFilms) {
    const details = film._tmdbId
      ? tmdbCacheById.get(film._tmdbId)
      : tmdbCacheByTitle.get(cleanTitle(film.title));

    // Generate unique slug
    let slug = generateSlug(film.title);
    let counter = 1;
    while (usedSlugs.has(slug)) {
      slug = `${generateSlug(film.title)}-${counter}`;
      counter++;
    }
    usedSlugs.add(slug);

    filmsIndex[slug] = {
      slug,
      title: film.title,
      director: film.director,
      length: film.length,
      posterUrl: film.posterUrl || details?.posterPath || '',
      tmdb: details ? {
        id: details.tmdbId,
        overview: details.overview,
        releaseDate: details.releaseDate,
        genres: details.genres,
        youtubeTrailerId: details.youtubeTrailerId,
      } : null,
      cinemaShowtimes: film.cinemaShowtimes,
    };
  }

  return filmsIndex;
}

async function main() {
  const startTime = performance.now();
  console.log('Fetching showtimes...\n');

  const cinemas = await fetchAllCinemas();
  const outputPath = 'src/data/films.json';

  mkdirSync(dirname(outputPath), { recursive: true });

  // Generate films.json with TMDB details
  const filmsIndex = await generateFilmsJson(cinemas);
  writeFileSync(outputPath, JSON.stringify(filmsIndex, null, 2));

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\nWrote ${Object.keys(filmsIndex).length} films to ${outputPath}`);
  console.log(`Last updated: ${new Date().toISOString()}`);
  console.log(`Total time: ${elapsed}s`);
}

main().catch(err => {
  console.error('Failed to fetch showtimes:', err);
  process.exit(1);
});
