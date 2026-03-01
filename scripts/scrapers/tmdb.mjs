import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { cleanTitle } from '../../src/utils/filmTitle.mjs';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CACHE_PATH = 'src/data/tmdb-cache.json';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

// Load/save cache
let cache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, 'utf-8'))
  : {};
const saveCache = () =>
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

function findTrailer(videos) {
  return (
    videos?.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    ) ||
    videos?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos?.find((v) => v.site === 'YouTube')
  );
}

function getNlReleaseDate(releaseDates) {
  const nl = releaseDates?.find((r) => r.iso_3166_1 === 'NL');
  if (!nl?.release_dates?.length) return null;
  // Get the earliest theatrical release (type 3) or any release
  const theatrical = nl.release_dates.find((d) => d.type === 3);
  const anyRelease = nl.release_dates[0];
  const date = theatrical?.release_date || anyRelease?.release_date;
  return date ? date.split('T')[0] : null;
}

function buildResult(movie, details, videos, releaseDates, director) {
  return {
    tmdbId: movie.id,
    director: director || null,
    overview: details?.overview || null,
    releaseDate: details?.release_date || movie.release_date || null,
    releaseDateNl: getNlReleaseDate(releaseDates),
    genres: (details?.genres || []).map((g) => g.name),
    posterPath: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null,
    youtubeTrailerId: findTrailer(videos)?.key || null,
  };
}

async function fetchDetails(movieId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos,release_dates,credits`
  );
  if (!res.ok) return { details: null, videos: [], releaseDates: [], director: null };
  const data = await res.json();
  const videos = data.videos?.results || [];
  const releaseDates = data.release_dates?.results || [];
  const director = data.credits?.crew?.find((c) => c.job === 'Director')?.name || null;
  return { details: data, videos, releaseDates, director };
}

export async function fetchTmdbMovieDetails(tmdbId) {
  if (!TMDB_API_KEY || !tmdbId) return null;

  const cacheKey = `id:${tmdbId}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const { details, videos, releaseDates, director: tmdbDirector } = await fetchDetails(tmdbId);
    if (!details) return null;

    const result = buildResult(details, details, videos, releaseDates, tmdbDirector);
    cache[cacheKey] = result;
    saveCache();
    return result;
  } catch {
    return null;
  }
}

export async function searchTmdbMovieDetails(
  title,
  { director = null, year = null } = {}
) {
  if (!TMDB_API_KEY || !title) return null;

  const cacheKey = `${cleanTitle(title)}|${director?.toLowerCase() || ''}|${year || ''}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const searchTitle = cleanTitle(title);
    let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`;
    if (year) url += `&year=${year}`;

    const searchRes = await fetch(url);
    if (!searchRes.ok) return null;
    const { results } = await searchRes.json();
    if (!results?.length) return null;

    // Score results: exact title > partial match > popularity
    const scored = results.map((r) => {
      const t = cleanTitle(r.title || '');
      const ot = cleanTitle(r.original_title || '');
      let score =
        t === searchTitle || ot === searchTitle
          ? 100
          : t.includes(searchTitle) || searchTitle.includes(t) ||
              ot.includes(searchTitle) || searchTitle.includes(ot)
            ? 50
            : 0;
      if (year && r.release_date?.startsWith(String(year))) score += 30;
      score += Math.min(r.popularity || 0, 20);
      return { movie: r, score };
    });
    const candidates = scored.sort((a, b) => b.score - a.score);

    // If we have a director, validate against TMDB credits — director must match.
    let bestMatch;
    let fetchedDetails = null;
    if (director) {
      const normalizeDirector = (s) =>
        s
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
      const targetDirector = normalizeDirector(director);

      for (const { movie } of candidates.slice(0, 5)) {
        const fetched = await fetchDetails(movie.id);
        const tmdbDirectors = (fetched.details?.credits?.crew || [])
          .filter((c) => c.job === 'Director')
          .map((c) => normalizeDirector(c.name));
        if (tmdbDirectors.some((d) => d === targetDirector)) {
          bestMatch = movie;
          fetchedDetails = fetched;
          break;
        }
      }
      // Director validation failed — fall back to year-constrained search if available
      if (!bestMatch && year) {
        const yearRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}&year=${year}`
        );
        if (yearRes.ok) {
          const { results: yearResults } = await yearRes.json();
          if (yearResults?.length) bestMatch = yearResults[0];
        }
      }
      if (!bestMatch) return null;
    } else {
      const top = candidates[0];
      if (top.score < 50) return null;
      bestMatch = top.movie;
    }

    const { details, videos, releaseDates, director: tmdbDirector } =
      fetchedDetails || (await fetchDetails(bestMatch.id));
    const result = buildResult(bestMatch, details, videos, releaseDates, tmdbDirector);

    cache[cacheKey] = result;
    saveCache();
    return result;
  } catch {
    return null;
  }
}
