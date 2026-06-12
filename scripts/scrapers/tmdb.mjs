import { readFileSync, writeFileSync, existsSync } from 'fs';
import { cleanTitle } from '../../src/utils/filmTitle.mjs';

// Read from the environment (set via .env locally, CI secrets in Actions).
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  throw new Error(
    'TMDB_API_KEY is not set. Add it to .env before running the scraper.'
  );
}
const CACHE_PATH = 'src/data/tmdb-cache.json';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

// Load/save cache
let cache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, 'utf-8'))
  : {};
const saveCache = () =>
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

const TMDB_BASE = 'https://api.themoviedb.org/3';

// GET a TMDB endpoint with the api_key injected. Returns the parsed JSON, or
// null on a non-OK response. `params` values are URL-encoded automatically.
async function tmdbGet(path, params = {}) {
  const query = new URLSearchParams({ api_key: TMDB_API_KEY, ...params });
  const res = await fetch(`${TMDB_BASE}/${path}?${query}`);
  return res.ok ? res.json() : null;
}

// Strip diacritics and punctuation but keep spaces (so last names stay split).
const normalizeName = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim();

// Split a source director field ("A, B & C") into normalized names, plus the
// individual >1-char words (for fuzzy last-name matching across spelling diffs).
function parseDirectors(director) {
  const names = director
    .split(/,|\s+&\s+|\s+and\s+/i)
    .map((d) => normalizeName(d))
    .filter(Boolean);
  const words = names.flatMap((n) =>
    n.split(/\s+/).filter((w) => w.length > 1)
  );
  return { names, words };
}

// The directors credited on a TMDB movie-details payload, normalized.
const creditedDirectors = (details) =>
  (details?.credits?.crew || [])
    .filter((c) => c.job === 'Director')
    .map((c) => normalizeName(c.name));

// Does any target director match the movie's credited directors? Matches on
// full normalized name or any shared name-word (handles diacritics/romanization).
function directorMatches(targets, movieDirectors) {
  const movieWords = movieDirectors.flatMap((d) =>
    d.split(/\s+/).filter((w) => w.length > 1)
  );
  return (
    targets.names.some((n) => movieDirectors.includes(n)) ||
    targets.words.some((w) => movieWords.includes(w))
  );
}

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

// Shape a cache entry from a search-result `movie` and the `fetched` payload
// returned by fetchDetails() (details, videos, releaseDates, director, ids...).
function buildResult(movie, fetched) {
  const { details, videos, releaseDates, director } = fetched;
  return {
    tmdbId: movie.id,
    director: director || null,
    overview: details?.overview || null,
    releaseDate: details?.release_date || movie.release_date || null,
    releaseDateNl: getNlReleaseDate(releaseDates),
    genres: (details?.genres || []).map((g) => g.name),
    originalLanguage: details?.original_language || null,
    runtime: details?.runtime || null,
    posterPath: movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null,
    youtubeTrailerId: findTrailer(videos)?.key || null,
    imdbId: fetched.imdbId || null,
    rtId: fetched.rtId || null,
    metacriticId: fetched.metacriticId || null,
    rtScore: fetched.rtScore || null,
    metacriticScore: fetched.metacriticScore || null,
    letterboxdId: fetched.letterboxdId || null,
  };
}

// Serialize all Wikidata requests to avoid triggering rate limits
let wikidataQueue = Promise.resolve();
const WIKIDATA_DELAY_MS = 200;

async function fetchWikidataIds(wikidataId) {
  if (!wikidataId) return {};
  const result = await (wikidataQueue = wikidataQueue.then(async () => {
    try {
      let res;
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) {
          const retryAfter = res?.headers?.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : attempt * 5000;
          await new Promise((r) => setTimeout(r, delay));
        }
        res = await fetch(
          `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`
        );
        if (res.status !== 429) break;
      }
      if (!res.ok) {
        console.warn(
          `Wikidata fetch failed for ${wikidataId}: HTTP ${res.status}`
        );
        return {};
      }
      const data = await res.json();
      // Proactive delay before the next request
      await new Promise((r) => setTimeout(r, WIKIDATA_DELAY_MS));
      return data;
    } catch (err) {
      console.warn(`Wikidata fetch error for ${wikidataId}:`, err.message);
      return {};
    }
  }));
  if (!result?.entities) return {};
  try {
    const claims = result.entities[wikidataId]?.claims || {};

    const rtId = claims['P1258']?.[0]?.mainsnak?.datavalue?.value || null;
    const metacriticId =
      claims['P1712']?.[0]?.mainsnak?.datavalue?.value || null;
    const letterboxdId =
      claims['P6127']?.[0]?.mainsnak?.datavalue?.value || null;

    // Extract scores by source (Q105584 = Rotten Tomatoes, Q150248 = Metacritic)
    let rtScore = null;
    let metacriticScore = null;
    for (const s of claims['P444'] || []) {
      const score = s.mainsnak?.datavalue?.value;
      const byId = s.qualifiers?.P447?.[0]?.datavalue?.value?.id;
      if (byId === 'Q105584' && score?.endsWith('%')) rtScore = score;
      if (byId === 'Q150248') metacriticScore = score;
    }

    return { rtId, metacriticId, rtScore, metacriticScore, letterboxdId };
  } catch (err) {
    console.warn(`Wikidata fetch error for ${wikidataId}:`, err.message);
    return {};
  }
}

async function fetchDetails(movieId) {
  const data = await tmdbGet(`movie/${movieId}`, {
    append_to_response: 'videos,release_dates,credits,external_ids',
  });
  if (!data)
    return { details: null, videos: [], releaseDates: [], director: null };
  const videos = data.videos?.results || [];
  const releaseDates = data.release_dates?.results || [];
  const director =
    data.credits?.crew?.find((c) => c.job === 'Director')?.name || null;
  const imdbId = data.imdb_id || data.external_ids?.imdb_id || null;
  const wikidataId = data.external_ids?.wikidata_id || null;
  const wikidata = await fetchWikidataIds(wikidataId);
  return { details: data, videos, releaseDates, director, imdbId, ...wikidata };
}

export async function fetchTmdbMovieDetails(tmdbId) {
  if (!TMDB_API_KEY || !tmdbId) return null;

  const cacheKey = `id:${tmdbId}`;
  if (cache[cacheKey]) return cache[cacheKey];

  try {
    const fetched = await fetchDetails(tmdbId);
    if (!fetched.details) return null;

    const result = buildResult(fetched.details, fetched);
    cache[cacheKey] = result;
    saveCache();
    return result;
  } catch (err) {
    console.warn(
      `TMDB fetch by ID ${tmdbId} failed (not cached):`,
      err.message
    );
    return null;
  }
}

// Cinemas prefix films with a series/programme name. Return the substring after
// the last such separator (colon, spaced dash, or " presents "), or null.
// e.g. "club imagine: the furious" -> "the furious"
//      "koolhovens keuze: female heroes - everything everywhere all at once"
//          -> "everything everywhere all at once"
function stripProgrammePrefix(searchTitle) {
  const m = searchTitle.match(/.*(?::|\s-\s|\spresents:?\s)\s*(.+)$/);
  return m ? m[1].trim() : null;
}

const titlesOverlap = (a, b) => a === b || a.includes(b) || b.includes(a);

// Score a search result against the wanted title(s). Exact full-title match wins;
// then partial; then a (lower) score against the stripped programme title.
function scoreCandidate(movie, searchTitle, postColonTitle, year) {
  const t = cleanTitle(movie.title || '');
  const ot = cleanTitle(movie.original_title || '');
  let score = 0;
  if (t === searchTitle || ot === searchTitle) score = 100;
  else if (titlesOverlap(t, searchTitle) || titlesOverlap(ot, searchTitle))
    score = 50;
  else if (postColonTitle) {
    if (t === postColonTitle || ot === postColonTitle) score = 90;
    else if (
      titlesOverlap(t, postColonTitle) ||
      titlesOverlap(ot, postColonTitle)
    )
      score = 40;
  }
  if (year && movie.release_date?.startsWith(String(year))) score += 30;
  score += Math.min(movie.popularity || 0, 20);
  return score;
}

// Authoritative match: find the director on TMDB, then look for one of `titles`
// in their directing filmography. Catches films too new/obscure for title search
// (e.g. unreleased festival shorts with 0 votes). Returns a movie stub or null.
async function findInFilmography(targets, titles) {
  const wanted = titles.filter(Boolean);
  const people = (await tmdbGet('search/person', { query: targets.names[0] }))
    ?.results;
  for (const person of (people || []).slice(0, 3)) {
    if (!targets.names.includes(normalizeName(person.name))) continue;
    const credits = await tmdbGet(`person/${person.id}/movie_credits`);
    const directed = (credits?.crew || []).filter((c) => c.job === 'Director');

    // Exact title match within the confirmed director's filmography.
    const exact = directed.find((c) =>
      wanted.some(
        (w) =>
          w === cleanTitle(c.title || '') ||
          w === cleanTitle(c.original_title || '')
      )
    );
    if (exact) return exact;

    // Containment fallback: the source may prefix the title (e.g. "Vier feest
    // met Dikkie Dik en de verdwenen knuffel" vs. TMDB's "Dikkie Dik en de
    // verdwenen knuffel"). Safe because the director is confirmed; the length
    // guard avoids spurious matches on short/ambiguous titles.
    const contained = directed.find((c) =>
      [cleanTitle(c.title || ''), cleanTitle(c.original_title || '')]
        .filter((s) => s.length >= 8)
        .some((ct) => wanted.some((w) => w.includes(ct) || ct.includes(w)))
    );
    if (contained) return contained;
  }
  return null;
}

// Scan up to `limit` movies, returning the first whose credited directors match
// the target. Returns { movie, fetched } (so the caller can reuse the details).
async function findByDirectorInResults(movies, targets, limit) {
  for (const movie of movies.slice(0, limit)) {
    const fetched = await fetchDetails(movie.id);
    if (directorMatches(targets, creditedDirectors(fetched.details))) {
      return { movie, fetched };
    }
  }
  return null;
}

// A single unambiguous result for `originalTitle`, or null. Used to break ties
// when the listed title alone is ambiguous.
async function singleByOriginalTitle(originalTitle) {
  if (!originalTitle) return null;
  const res = await tmdbGet('search/movie', {
    query: cleanTitle(originalTitle),
  });
  return res?.results?.length === 1 ? res.results[0] : null;
}

// Choose a movie when we have no director to validate against. Returns the
// chosen movie, or null if no confident choice can be made (caller decides how
// to log/retry). Requires a reasonable top score and disambiguates exact-title
// collisions by original-title search, then by a dominant vote count.
async function pickWithoutDirector(
  candidates,
  searchTitle,
  originalTitle,
  year
) {
  const top = candidates[0];
  if (!top || top.score < 50) return null;

  const exactMatches = candidates.filter(
    (c) =>
      cleanTitle(c.movie.title || '') === searchTitle ||
      cleanTitle(c.movie.original_title || '') === searchTitle
  );

  // Exactly one exact title match — unambiguous.
  if (exactMatches.length === 1) return exactMatches[0].movie;

  // Multiple exact matches and no year to help differentiate.
  if (exactMatches.length > 1 && !year) {
    const byOriginal = await singleByOriginalTitle(originalTitle);
    if (byOriginal) return byOriginal;

    // Tie-break by vote count: pick the one exact match that is overwhelmingly
    // more established (e.g. Sean Baker's "Tangerine", 799 votes vs. 0-2).
    const byVotes = [...exactMatches].sort(
      (a, b) => (b.movie.vote_count || 0) - (a.movie.vote_count || 0)
    );
    const topVotes = byVotes[0].movie.vote_count || 0;
    const runnerUpVotes = byVotes[1].movie.vote_count || 0;
    if (topVotes >= 50 && topVotes >= runnerUpVotes * 10) {
      return byVotes[0].movie;
    }
    return null; // genuinely ambiguous
  }

  // Partial match, or multiple exact matches with a year to help: prefer a
  // single original-title result (only when no year), else take the top score.
  if (!year) {
    const byOriginal = await singleByOriginalTitle(originalTitle);
    if (byOriginal) return byOriginal;
  }
  return top.movie;
}

export async function searchTmdbMovieDetails(
  title,
  { director = null, year = null, originalTitle = null } = {}
) {
  if (!TMDB_API_KEY) return null;
  if (!title) return null;

  const cacheKey = `${cleanTitle(title)}|${director?.toLowerCase() || ''}|${year || ''}`;
  if (cache[cacheKey]) return cache[cacheKey];
  // Also check without year — result may have been cached before year was known
  const cacheKeyNoYear = `${cleanTitle(title)}|${director?.toLowerCase() || ''}|`;
  if (year && cache[cacheKeyNoYear]) {
    cache[cacheKey] = cache[cacheKeyNoYear];
    saveCache();
    return cache[cacheKey];
  }
  console.log(`TMDB cache miss: "${cacheKey}"`);

  // Retry under a stripped title, then back-fill the result under THIS key so
  // future builds hit the cache directly instead of re-running the full search
  // and recursing every time.
  const retryAndCache = async (retryTitle) => {
    const result = await searchTmdbMovieDetails(retryTitle, {
      director,
      year,
      originalTitle,
    });
    if (result) {
      cache[cacheKey] = result;
      saveCache();
    }
    return result;
  };

  try {
    const searchTitle = cleanTitle(title);
    const postColonTitle = stripProgrammePrefix(searchTitle);

    const search = await tmdbGet('search/movie', { query: searchTitle });
    if (!search) {
      console.warn(`TMDB: search request failed for "${title}"`);
      return null;
    }
    const results = search.results || [];

    // No results: retry with the stripped programme title if we have one.
    // With no stripped title but a director, fall through — the filmography
    // lookup can still find the film (e.g. a Dutch title TMDB lists in English).
    if (!results.length) {
      if (postColonTitle) {
        console.log(
          `TMDB: no results for "${title}", retrying with post-colon title "${postColonTitle}"`
        );
        return retryAndCache(postColonTitle);
      }
      if (!director) return null;
    }

    const candidates = results
      .map((movie) => ({
        movie,
        score: scoreCandidate(movie, searchTitle, postColonTitle, year),
      }))
      .sort((a, b) => b.score - a.score);

    let bestMatch;
    let fetchedDetails = null;

    if (director) {
      const targets = parseDirectors(director);
      const wantedTitles = [searchTitle, postColonTitle];

      // Try each strategy in turn until one yields a match (director must agree).
      bestMatch = await findInFilmography(targets, wantedTitles);

      if (!bestMatch) {
        // The director name may differ between source and TMDB (diacritics,
        // romanization) — validate the title-search candidates by their credits.
        const found = await findByDirectorInResults(
          candidates.map((c) => c.movie),
          targets,
          10
        );
        if (found) ({ movie: bestMatch, fetched: fetchedDetails } = found);
      }
      if (!bestMatch && originalTitle) {
        // Retry the search under the original title (e.g. non-English films).
        const orig = await tmdbGet('search/movie', {
          query: cleanTitle(originalTitle),
        });
        const found = await findByDirectorInResults(
          orig?.results || [],
          targets,
          5
        );
        if (found) ({ movie: bestMatch, fetched: fetchedDetails } = found);
      }
      if (!bestMatch && year) {
        // Director never matched — fall back to a year-constrained title search.
        const byYear = await tmdbGet('search/movie', {
          query: searchTitle,
          year,
        });
        if (byYear?.results?.length) bestMatch = byYear.results[0];
      }
      if (!bestMatch && postColonTitle) {
        console.log(
          `TMDB: no director match for "${title}", retrying with post-colon title "${postColonTitle}"`
        );
        return retryAndCache(postColonTitle);
      }
      if (!bestMatch) {
        console.warn(
          `TMDB: no director match for "${title}" (director: "${director}") — skipping`
        );
        return null;
      }
    } else {
      bestMatch = await pickWithoutDirector(
        candidates,
        searchTitle,
        originalTitle,
        year
      );
      if (!bestMatch) {
        if (postColonTitle) {
          console.log(
            `TMDB: low score for "${title}", retrying with post-colon title "${postColonTitle}"`
          );
          return retryAndCache(postColonTitle);
        }
        const top = candidates[0];
        if (top && top.score < 50) {
          console.warn(
            `TMDB: no match for "${title}" (top score ${top.score}) — skipping`
          );
        } else {
          console.warn(
            `TMDB: ambiguous title "${title}" — no confident match — skipping`
          );
        }
        return null;
      }
    }

    const fetched = fetchedDetails || (await fetchDetails(bestMatch.id));
    const result = buildResult(bestMatch, fetched);

    cache[cacheKey] = result;
    saveCache();
    return result;
  } catch (err) {
    console.warn(
      `TMDB search for "${title}" failed (not cached):`,
      err.message
    );
    return null;
  }
}
