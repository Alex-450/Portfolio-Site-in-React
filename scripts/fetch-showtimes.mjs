import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fetchAllRssFeeds } from './scrapers/rss-feeds.mjs';
import { fetchKriterion } from './scrapers/kriterion.mjs';
import { fetchFcHyena } from './scrapers/fc-hyena.mjs';
import { fetchEye } from './scrapers/eye.mjs';
import { fetchTmdbPoster, searchTmdbPoster, searchTmdbMovieDetails, fetchTmdbMovieDetails } from './scrapers/tmdb.mjs';
import { cleanTitle, generateSlug, extractVariant, getCleanDisplayTitle } from '../src/utils/filmTitle.mjs';

// Process items in batches to avoid rate limiting
async function processBatched(items, fn, batchSize = 5, delayMs = 250) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return results;
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
          permalink: film.permalink,
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

  console.log(`\nFetching TMDB details for ${groupedFilms.length} films...`);

  // Fetch TMDB details in batches to avoid rate limiting
  const tmdbResults = await processBatched(groupedFilms, async (film) => {
    if (film._tmdbId) {
      return { film, details: await fetchTmdbMovieDetails(film._tmdbId) };
    }
    return { film, details: await searchTmdbMovieDetails(film.title) };
  });

  for (const { film, details } of tmdbResults) {
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
      permalink: film.permalink,
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
  console.log('Fetching showtimes...\n');

  const cinemas = await fetchAllCinemas();
  const outputPath = 'src/data/films.json';

  mkdirSync(dirname(outputPath), { recursive: true });

  // Generate films.json with TMDB details
  const filmsIndex = await generateFilmsJson(cinemas);
  writeFileSync(outputPath, JSON.stringify(filmsIndex, null, 2));

  console.log(`\nWrote ${Object.keys(filmsIndex).length} films to ${outputPath}`);
  console.log(`Last updated: ${new Date().toISOString()}`);
}

main().catch(err => {
  console.error('Failed to fetch showtimes:', err);
  process.exit(1);
});
