import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { cleanTitle } from '../../src/utils/filmTitle.mjs';

dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  throw new Error(
    'TMDB_API_KEY is not set. Add it to .env.local before running the scraper.'
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

function buildResult(
  movie,
  details,
  videos,
  releaseDates,
  director,
  imdbId,
  rtId,
  metacriticId,
  rtScore,
  metacriticScore,
  letterboxdId
) {
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
    imdbId: imdbId || null,
    rtId: rtId || null,
    metacriticId: metacriticId || null,
    rtScore: rtScore || null,
    metacriticScore: metacriticScore || null,
    letterboxdId: letterboxdId || null,
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
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos,release_dates,credits,external_ids`
  );
  if (!res.ok)
    return { details: null, videos: [], releaseDates: [], director: null };
  const data = await res.json();
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
    const {
      details,
      videos,
      releaseDates,
      director: tmdbDirector,
      imdbId,
      rtId,
      metacriticId,
      rtScore,
      metacriticScore,
      letterboxdId,
    } = await fetchDetails(tmdbId);
    if (!details) return null;

    const result = buildResult(
      details,
      details,
      videos,
      releaseDates,
      tmdbDirector,
      imdbId,
      rtId,
      metacriticId,
      rtScore,
      metacriticScore,
      letterboxdId
    );
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

    // Extract the substring after the last programme-style separator (colon,
    // spaced dash, or " presents ") for fallback scoring. Cinemas prefix films
    // with a series name, e.g. "club imagine: the furious" -> "the furious",
    // "kaboom cult presents the lord of the rings" -> "the lord of the rings",
    // and may nest both, e.g.
    // "koolhovens keuze: female heroes - everything everywhere all at once".
    const sepMatch = searchTitle.match(/.*(?::|\s-\s|\spresents:?\s)\s*(.+)$/);
    const postColonTitle = sepMatch ? sepMatch[1].trim() : null;

    let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}`;

    const searchRes = await fetch(url);

    if (!searchRes.ok) {
      console.warn(
        `TMDB: search request failed for "${title}": HTTP ${searchRes.status}`
      );
      return null;
    }
    const { results } = await searchRes.json();

    // If the full title search returns nothing, retry with the post-colon part
    // if we have one. With no post-colon part but a director, fall through: the
    // director-filmography lookup below can still find the film (e.g. a Dutch
    // title TMDB only lists under its English name). Otherwise give up.
    if (!results?.length) {
      if (postColonTitle) {
        console.log(
          `TMDB: no results for "${title}", retrying with post-colon title "${postColonTitle}"`
        );
        return retryAndCache(postColonTitle);
      }
      if (!director) return null;
    }

    // Score results: exact title > partial match > popularity.
    // Also score against post-colon part so e.g. "the furious" surfaces when
    // the cinema lists the film as "Club Imagine: The Furious".
    const scored = (results || []).map((r) => {
      const t = cleanTitle(r.title || '');
      const ot = cleanTitle(r.original_title || '');
      let score =
        t === searchTitle || ot === searchTitle
          ? 100
          : t.includes(searchTitle) ||
              searchTitle.includes(t) ||
              ot.includes(searchTitle) ||
              searchTitle.includes(ot)
            ? 50
            : 0;

      // Fallback: score against post-colon part (slightly lower than full-title match)
      if (score === 0 && postColonTitle) {
        score =
          t === postColonTitle || ot === postColonTitle
            ? 90
            : t.includes(postColonTitle) ||
                postColonTitle.includes(t) ||
                ot.includes(postColonTitle) ||
                postColonTitle.includes(ot)
              ? 40
              : 0;
      }

      if (year && r.release_date?.startsWith(String(year))) score += 30;
      score += Math.min(r.popularity || 0, 20);
      return { movie: r, score };
    });
    const candidates = scored.sort((a, b) => b.score - a.score);

    // If we have a director, validate against TMDB credits — director must match.
    let bestMatch;
    let fetchedDetails = null;
    if (director) {
      // Normalize a name: strip diacritics and punctuation but preserve spaces for last-name splitting
      const normalizeDirector = (s) =>
        s
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .trim();
      // Support multiple directors separated by commas, "&", or "and"
      const targetDirectors = director
        .split(/,|\s+&\s+|\s+and\s+/i)
        .map((d) => normalizeDirector(d.trim()))
        .filter(Boolean);
      // Words in target names longer than 1 char (skip initials like "j.")
      const targetWords = targetDirectors.flatMap((d) =>
        d.split(/\s+/).filter((w) => w.length > 1)
      );

      // Primary path: look the director up by name and scan their filmography
      // for a title match. This is authoritative — it finds the film even when
      // it's too new/obscure to surface in popularity-ranked title search (e.g.
      // an unreleased festival short with 0 votes).
      const titleForFilmography = postColonTitle || searchTitle;
      const personRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(targetDirectors[0])}`
      );
      if (personRes.ok) {
        const { results: people } = await personRes.json();
        for (const person of (people || []).slice(0, 3)) {
          const normPerson = normalizeDirector(person.name || '');
          if (!targetDirectors.includes(normPerson)) continue;
          const credRes = await fetch(
            `https://api.themoviedb.org/3/person/${person.id}/movie_credits?api_key=${TMDB_API_KEY}`
          );
          if (!credRes.ok) continue;
          const { crew } = await credRes.json();
          const directed = (crew || []).filter((c) => c.job === 'Director');
          const wanted = [searchTitle, titleForFilmography].filter(Boolean);
          // Exact title match within the confirmed director's filmography.
          let hit = directed.find((c) => {
            const t = cleanTitle(c.title || '');
            const ot = cleanTitle(c.original_title || '');
            return wanted.includes(t) || wanted.includes(ot);
          });
          // Containment fallback: the source may prefix the title (e.g. "Vier
          // feest met Dikkie Dik en de verdwenen knuffel" vs. TMDB's original
          // "Dikkie Dik en de verdwenen knuffel"). Safe here because the
          // director is already confirmed; guard against short/ambiguous titles.
          if (!hit) {
            hit = directed.find((c) => {
              const credTitles = [
                cleanTitle(c.title || ''),
                cleanTitle(c.original_title || ''),
              ].filter((s) => s.length >= 8);
              return credTitles.some((ct) =>
                wanted.some((w) => w.includes(ct) || ct.includes(w))
              );
            });
          }
          if (hit) {
            bestMatch = hit;
            break;
          }
        }
      }

      // Fallback: the director name may differ between the source and TMDB
      // (diacritics, romanization). Validate the title-search candidates against
      // TMDB credits, matching on individual name words too (fuzzier recall).
      if (!bestMatch) {
        for (const { movie } of candidates.slice(0, 10)) {
          const fetched = await fetchDetails(movie.id);
          const tmdbDirectors = (fetched.details?.credits?.crew || [])
            .filter((c) => c.job === 'Director')
            .map((c) => normalizeDirector(c.name));
          const tmdbWords = tmdbDirectors.flatMap((d) =>
            d.split(/\s+/).filter((w) => w.length > 1)
          );
          if (
            targetDirectors.some((td) => tmdbDirectors.includes(td)) ||
            targetWords.some((w) => tmdbWords.includes(w))
          ) {
            bestMatch = movie;
            fetchedDetails = fetched;
            break;
          }
        }
      }
      // If still no match, try searching by original title (e.g. non-English films)
      if (!bestMatch && originalTitle) {
        const origSearchTitle = cleanTitle(originalTitle);
        const origRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(origSearchTitle)}`
        );
        if (origRes.ok) {
          const { results: origResults } = await origRes.json();
          for (const movie of (origResults || []).slice(0, 5)) {
            const fetched = await fetchDetails(movie.id);
            const tmdbDirectors = (fetched.details?.credits?.crew || [])
              .filter((c) => c.job === 'Director')
              .map((c) => normalizeDirector(c.name));
            const tmdbLastNames = tmdbDirectors.map((d) =>
              d.split(/\s+/).at(-1)
            );
            if (
              targetDirectors.some((td) => tmdbDirectors.includes(td)) ||
              targetWords.some((w) => tmdbLastNames.includes(w))
            ) {
              bestMatch = movie;
              fetchedDetails = fetched;
              break;
            }
          }
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
      // Last resort: retry with post-colon title
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
      const top = candidates[0];
      if (top.score < 50) {
        // Last resort: retry with post-colon title
        if (postColonTitle) {
          console.log(
            `TMDB: low score for "${title}", retrying with post-colon title "${postColonTitle}"`
          );
          return retryAndCache(postColonTitle);
        }
        console.warn(
          `TMDB: no match for "${title}" (top score ${top.score}) — skipping`
        );
        return null;
      }

      // Count exact title matches (raw title only, before year/popularity bonuses)
      const exactMatches = candidates.filter((c) => {
        const t = cleanTitle(c.movie.title || '');
        const ot = cleanTitle(c.movie.original_title || '');
        return t === searchTitle || ot === searchTitle;
      });

      if (exactMatches.length === 1) {
        // Unambiguous — exactly one title match, use it
        bestMatch = exactMatches[0].movie;
      } else if (exactMatches.length > 1 && !year) {
        // Multiple exact matches with no year or director to differentiate —
        // try searching by original title without year constraint first
        if (originalTitle) {
          const origSearchTitle = cleanTitle(originalTitle);
          const origRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(origSearchTitle)}`
          );
          if (origRes.ok) {
            const { results: origResults } = await origRes.json();
            if (origResults?.length === 1) {
              bestMatch = origResults[0];
            }
          }
        }
        // Tie-break by vote count: if one exact match is overwhelmingly more
        // established than the rest (e.g. Sean Baker's "Tangerine" with 799 votes
        // vs. 0-2 for its namesakes), it's safe to pick it.
        if (!bestMatch) {
          const byVotes = [...exactMatches].sort(
            (a, b) => (b.movie.vote_count || 0) - (a.movie.vote_count || 0)
          );
          const topVotes = byVotes[0].movie.vote_count || 0;
          const runnerUpVotes = byVotes[1].movie.vote_count || 0;
          if (topVotes >= 50 && topVotes >= runnerUpVotes * 10) {
            bestMatch = byVotes[0].movie;
          }
        }
        if (!bestMatch) {
          console.warn(
            `TMDB: ambiguous title "${title}" (${exactMatches.length} exact matches, no year/director) — skipping`
          );
          return null;
        }
      } else {
        // Either no exact match (partial only) or multiple exact matches with year to help —
        // if original title search yields a single unambiguous result, prefer it over title+year
        if (originalTitle && !year) {
          const origSearchTitle = cleanTitle(originalTitle);
          const origRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(origSearchTitle)}`
          );
          if (origRes.ok) {
            const { results: origResults } = await origRes.json();
            if (origResults?.length === 1) {
              bestMatch = origResults[0];
            }
          }
        }
        if (!bestMatch) bestMatch = top.movie;
      }
    }

    const {
      details,
      videos,
      releaseDates,
      director: tmdbDirector,
      imdbId,
      rtId,
      metacriticId,
      rtScore,
      metacriticScore,
      letterboxdId,
    } = fetchedDetails || (await fetchDetails(bestMatch.id));
    const result = buildResult(
      bestMatch,
      details,
      videos,
      releaseDates,
      tmdbDirector,
      imdbId,
      rtId,
      metacriticId,
      rtScore,
      metacriticScore,
      letterboxdId
    );

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
