// Serialize all Wikidata requests to avoid triggering rate limits
let wikidataQueue = Promise.resolve();
const WIKIDATA_DELAY_MS = 200;

async function fetchWikidataIds(wikidataId) {
  if (!wikidataId) return {};
  const result = await (wikidataQueue = wikidataQueue.then(async () => {
    try {
      let res;
      let lastError;
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) {
          const retryAfter = res?.headers?.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : attempt * 5000;
          await new Promise((r) => setTimeout(r, delay));
        }
        // A timeout or network error is retryable too — not just a 429 — so
        // catch it here rather than letting it break out of the retry loop.
        try {
          res = await fetch(
            `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`,
            { signal: AbortSignal.timeout(30000) }
          );
          lastError = null;
          if (res.status !== 429) break;
        } catch (err) {
          res = undefined;
          lastError = err;
        }
      }
      if (lastError) {
        console.warn(
          `Wikidata fetch failed for ${wikidataId}: ${lastError.message}`
        );
        return {};
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

export { fetchWikidataIds };