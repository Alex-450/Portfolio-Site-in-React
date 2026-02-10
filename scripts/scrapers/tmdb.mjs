import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function fetchTmdbPoster(tmdbId) {
  if (!TMDB_API_KEY || !tmdbId) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.poster_path) return `https://image.tmdb.org/t/p/w342${data.poster_path}`;
  } catch { /* ignore */ }
  return null;
}

function cleanTitle(title) {
  return title
    .split(/[|•]/)[0]
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/´/g, "'")
    .trim()
    .toLowerCase();
}

async function searchTmdbPoster(title) {
  if (!TMDB_API_KEY || !title) return null;
  try {
    const searchTitle = cleanTitle(title);
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const match = data.results?.find(r => {
      const tmdbTitle = r.title?.toLowerCase() || '';
      return tmdbTitle.includes(searchTitle) || searchTitle.includes(tmdbTitle);
    }) || data.results?.[0];
    if (match?.poster_path) {
      return `https://image.tmdb.org/t/p/w342${match.poster_path}`;
    }
  } catch { /* ignore */ }
  return null;
}

export { fetchTmdbPoster, searchTmdbPoster, cleanTitle };
