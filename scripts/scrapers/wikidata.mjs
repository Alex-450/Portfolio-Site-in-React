// Wikidata supplies review-aggregator ids and scores (Rotten Tomatoes,
// Metacritic, Letterboxd). It is strictly supplementary: a film is perfectly
// usable without it, so every failure here degrades to {} rather than throwing.
//
// Wikidata rate-limits parallel clients aggressively — at 4 concurrent workers
// a real run tripped the failure budget and lost ~90 films their scores. Two
// workers with a short stagger keeps it under the limit while still running
// ~2x faster than the old one-at-a-time queue.
const WIKIDATA_CONCURRENCY = 2;
const REQUEST_SPACING_MS = 120;

// Give up on Wikidata for the rest of the run once this many requests have
// failed. A sustained outage or a rate-limit wall would otherwise cost the
// build a retry cycle per film for no benefit. Set high enough that ordinary
// per-film misses (a film with no Wikidata entry) don't trip it.
const FAILURE_BUDGET = 60;
let failureCount = 0;
let abandoned = false;

// Map the claims on a Wikidata entity to the fields we keep. Returns {} when
// the payload isn't shaped as expected.
function extractIds(entity, wikidataId) {
  const claims = entity?.entities?.[wikidataId]?.claims;
  if (!claims) return {};

  const rtId = claims['P1258']?.[0]?.mainsnak?.datavalue?.value || null;
  const metacriticId = claims['P1712']?.[0]?.mainsnak?.datavalue?.value || null;
  const letterboxdId = claims['P6127']?.[0]?.mainsnak?.datavalue?.value || null;

  // Scores by source (Q105584 = Rotten Tomatoes, Q150248 = Metacritic).
  let rtScore = null;
  let metacriticScore = null;
  for (const s of claims['P444'] || []) {
    const score = s.mainsnak?.datavalue?.value;
    const byId = s.qualifiers?.P447?.[0]?.datavalue?.value?.id;
    if (byId === 'Q105584' && score?.endsWith('%')) rtScore = score;
    if (byId === 'Q150248') metacriticScore = score;
  }

  return { rtId, metacriticId, rtScore, metacriticScore, letterboxdId };
}

// Fetch one entity. Retries only a 429, and only twice — Wikidata is optional,
// so it's better to skip a film's scores than to hold the build open for it.
async function fetchEntity(wikidataId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let res;
    try {
      res = await fetch(
        `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`,
        { signal: AbortSignal.timeout(15000) }
      );
    } catch (err) {
      // Network-level failure — one more try, then give up on this film.
      if (attempt === 2) throw err;
      continue;
    }

    if (res.status === 429) {
      // Honour Retry-After when given, else back off progressively. Worth
      // waiting out: the alternative is losing this film's scores.
      const retryAfter = parseInt(res.headers.get('Retry-After') || '', 10);
      await new Promise((r) =>
        setTimeout(
          r,
          Number.isFinite(retryAfter)
            ? Math.min(retryAfter, 10) * 1000
            : 1000 * (attempt + 1)
        )
      );
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}

export async function fetchWikidataIds(wikidataId) {
  if (!wikidataId || abandoned) return {};
  try {
    return extractIds(await fetchEntity(wikidataId), wikidataId);
  } catch (err) {
    failureCount++;
    if (failureCount === FAILURE_BUDGET) {
      abandoned = true;
      console.warn(
        `Wikidata: ${FAILURE_BUDGET} failures — skipping Wikidata for the rest of this run. Review scores may be missing; the build continues.`
      );
    } else if (!abandoned) {
      console.warn(`Wikidata fetch failed for ${wikidataId}: ${err.message}`);
    }
    return {};
  }
}

// Enrich resolved TMDB results with Wikidata ids, in place. Runs as its own
// pass so it never blocks the TMDB lookups: previously each TMDB detail fetch
// awaited a serialized Wikidata call, which collapsed the whole build to one
// request at a time.
//
// `entries` is a list of { result, wikidataId }. Never throws — Wikidata is
// supplementary, so a total outage leaves the films intact without scores.
export async function enrichWithWikidata(entries) {
  const pending = entries.filter((e) => e.wikidataId && e.result);
  if (pending.length === 0) return 0;

  console.log(`Fetching Wikidata ids for ${pending.length} films...`);

  let enriched = 0;
  let cursor = 0;
  const worker = async (slot) => {
    // Stagger the starts so the workers don't fire simultaneously.
    await new Promise((r) => setTimeout(r, slot * REQUEST_SPACING_MS));
    while (cursor < pending.length && !abandoned) {
      const { result, wikidataId } = pending[cursor++];
      const ids = await fetchWikidataIds(wikidataId);
      if (Object.keys(ids).length > 0) {
        Object.assign(result, ids);
        enriched++;
      }
      await new Promise((r) => setTimeout(r, REQUEST_SPACING_MS));
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(WIKIDATA_CONCURRENCY, pending.length) },
      (_, i) => worker(i)
    )
  );

  if (failureCount > 0) {
    console.warn(
      `Wikidata: ${failureCount} request(s) failed — those films keep their TMDB data without review scores.`
    );
  }
  return enriched;
}
