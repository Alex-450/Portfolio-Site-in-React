import he from 'he';

export function decodeAndTrim(string) {
  return he.decode(string).trim();
}

export function parseFilmLength(filmLength) {
  if (!filmLength) return null;
  const match = String(filmLength).match(/\d+/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

export async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    console.warn(`  Attempt ${attempt}/${retries} failed: ${response.status}`);
    if (attempt < retries)
      await new Promise((r) => setTimeout(r, attempt * 2000));
  }
  throw new Error(`Failed after ${retries} attempts`);
}
