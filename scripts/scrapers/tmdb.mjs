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

async function searchTmdbMovieDetails(title) {
  if (!TMDB_API_KEY || !title) return null;
  try {
    const searchTitle = cleanTitle(title);
    const searchRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();

    // Find best match
    const match = searchData.results?.find(r => {
      const tmdbTitle = r.title?.toLowerCase() || '';
      return tmdbTitle.includes(searchTitle) || searchTitle.includes(tmdbTitle);
    }) || searchData.results?.[0];

    if (!match) return null;

    // Fetch full movie details and videos in parallel
    const [detailsRes, videosRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${match.id}?api_key=${TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${match.id}/videos?api_key=${TMDB_API_KEY}`),
    ]);

    const details = detailsRes.ok ? await detailsRes.json() : null;
    const videosData = videosRes.ok ? await videosRes.json() : { results: [] };

    // Find YouTube trailer (prefer official trailers)
    const trailer = videosData.results?.find(
      v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    ) || videosData.results?.find(
      v => v.site === 'YouTube' && v.type === 'Trailer'
    ) || videosData.results?.find(
      v => v.site === 'YouTube'
    );

    // Map genre IDs to names
    const genres = (details?.genres || []).map(g => g.name);

    return {
      tmdbId: match.id,
      overview: details?.overview || null,
      releaseDate: details?.release_date || match.release_date || null,
      genres,
      posterPath: match.poster_path ? `https://image.tmdb.org/t/p/w342${match.poster_path}` : null,
      youtubeTrailerId: trailer?.key || null,
    };
  } catch { /* ignore */ }
  return null;
}

async function fetchTmdbMovieDetails(tmdbId) {
  if (!TMDB_API_KEY || !tmdbId) return null;
  try {
    // Fetch movie details and videos in parallel
    const [detailsRes, videosRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`),
    ]);

    if (!detailsRes.ok) return null;
    const details = await detailsRes.json();
    const videosData = videosRes.ok ? await videosRes.json() : { results: [] };

    // Find YouTube trailer
    const trailer = videosData.results?.find(
      v => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    ) || videosData.results?.find(
      v => v.site === 'YouTube' && v.type === 'Trailer'
    ) || videosData.results?.find(
      v => v.site === 'YouTube'
    );

    const genres = (details.genres || []).map(g => g.name);

    return {
      tmdbId: details.id,
      overview: details.overview || null,
      releaseDate: details.release_date || null,
      genres,
      posterPath: details.poster_path ? `https://image.tmdb.org/t/p/w342${details.poster_path}` : null,
      youtubeTrailerId: trailer?.key || null,
    };
  } catch { /* ignore */ }
  return null;
}

export { fetchTmdbPoster, searchTmdbPoster, searchTmdbMovieDetails, fetchTmdbMovieDetails, cleanTitle };
