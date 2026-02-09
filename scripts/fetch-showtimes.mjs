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

  // Collect unique TMDB IDs needing posters and fetch them once
  const filmsNeedingPoster = allFilms.filter(f => !f.posterUrl && f._tmdbId);
  const uniqueTmdbIds = [...new Set(filmsNeedingPoster.map(f => f._tmdbId))];

  if (uniqueTmdbIds.length > 0) {
    console.log(`\nFetching ${uniqueTmdbIds.length} unique posters from TMDB...`);
    const posterMap = new Map();
    await Promise.all(uniqueTmdbIds.map(async (tmdbId) => {
      const url = await fetchTmdbPoster(tmdbId);
      if (url) posterMap.set(tmdbId, url);
    }));

    // Apply posters to all films and update posterByTitle
    for (const film of filmsNeedingPoster) {
      const url = posterMap.get(film._tmdbId);
      if (url) {
        film.posterUrl = url;
        posterByTitle.set(cleanTitle(film.title), url);
      }
    }
  }

  // Search TMDB for films without posters, skipping titles we already have
  const filmsNeedingSearch = allFilms.filter(f => !f.posterUrl && f._needsTmdbSearch);
  const uniqueTitlesToSearch = [...new Map(filmsNeedingSearch.map(f => [cleanTitle(f.title), f])).values()]
    .filter(f => !posterByTitle.has(cleanTitle(f.title)));

  if (uniqueTitlesToSearch.length > 0) {
    console.log(`\nSearching TMDB for ${uniqueTitlesToSearch.length} unique film posters...`);
    for (const film of uniqueTitlesToSearch) {
      const url = await searchTmdbPoster(film.title);
      if (url) posterByTitle.set(cleanTitle(film.title), url);
      await new Promise(r => setTimeout(r, 100)); // Small delay between requests
    }
  }

  // Apply posters from posterByTitle to all films that still need them
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
