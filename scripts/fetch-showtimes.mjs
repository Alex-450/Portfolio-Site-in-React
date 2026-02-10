import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fetchAllRssFeeds } from './scrapers/rss-feeds.mjs';
import { fetchKriterion } from './scrapers/kriterion.mjs';
import { fetchFcHyena } from './scrapers/fc-hyena.mjs';
import { fetchEye } from './scrapers/eye.mjs';
import { fetchTmdbPoster, searchTmdbPoster, cleanTitle } from './scrapers/tmdb.mjs';

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

  // Build a map of cleaned title -> poster URL from films that already have posters
  const allFilms = cinemas.flatMap(c => c.films);
  const posterByTitle = new Map();
  for (const film of allFilms) {
    if (film.posterUrl) {
      posterByTitle.set(cleanTitle(film.title), film.posterUrl);
    }
  }

  // Collect all TMDB fetches needed: by ID or by title search
  const tmdbIdMap = new Map(); // tmdbId -> films needing this ID
  const titleSearchMap = new Map(); // cleanedTitle -> film to search

  for (const film of allFilms) {
    if (film.posterUrl) continue;
    const cleaned = cleanTitle(film.title);
    if (posterByTitle.has(cleaned)) continue;

    if (film._tmdbId) {
      if (!tmdbIdMap.has(film._tmdbId)) tmdbIdMap.set(film._tmdbId, []);
      tmdbIdMap.get(film._tmdbId).push(film);
    } else if (film._needsTmdbSearch && !titleSearchMap.has(cleaned)) {
      titleSearchMap.set(cleaned, film);
    }
  }

  // Fetch all posters in parallel (by ID and by title search)
  const fetchCount = tmdbIdMap.size + titleSearchMap.size;
  if (fetchCount > 0) {
    console.log(`\nFetching ${fetchCount} posters from TMDB...`);
    await Promise.all([
      ...Array.from(tmdbIdMap.keys()).map(async (tmdbId) => {
        const url = await fetchTmdbPoster(tmdbId);
        if (url) posterByTitle.set(cleanTitle(tmdbIdMap.get(tmdbId)[0].title), url);
      }),
      ...Array.from(titleSearchMap.values()).map(async (film) => {
        const url = await searchTmdbPoster(film.title);
        if (url) posterByTitle.set(cleanTitle(film.title), url);
      }),
    ]);
  }

  // Apply posters from posterByTitle to all films that need them
  for (const film of allFilms) {
    if (!film.posterUrl) {
      const url = posterByTitle.get(cleanTitle(film.title));
      if (url) film.posterUrl = url;
    }
  }

  // Clean up internal fields from all films
  for (const cinema of cinemas) {
    for (const film of cinema.films) {
      delete film._tmdbId;
      delete film._needsTmdbSearch;
    }
  }

  return cinemas;
}

async function main() {
  console.log('Fetching showtimes...\n');

  const cinemas = await fetchAllCinemas();
  const outputPath = 'src/data/showtimes.json';

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(cinemas, null, 2));

  console.log(`\nWrote ${cinemas.length} cinemas to ${outputPath}`);
  console.log(`Last updated: ${new Date().toISOString()}`);
}

main().catch(err => {
  console.error('Failed to fetch showtimes:', err);
  process.exit(1);
});
