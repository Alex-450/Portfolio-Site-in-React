import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import he from 'he';

// Load .env.local if present (Next.js doesn't load it for pre-scripts)
const envPath = '.env.local';
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w]+)\s*=\s*['"]?(.*?)['"]?\s*$/);
    if (match) process.env[match[1]] = match[2];
  }
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;

const FEEDS = [
  { name: 'LAB111', url: 'https://www.lab111.nl/feed' },
  { name: 'Studio K', url: 'https://www.studio-k.nu/feed' },
  { name: 'FilmHallen', url: 'https://www.filmhallen.nl/feed' },
  { name: 'The Movies', url: 'https://www.themovies.nl/feed' },
  { name: 'FilmKoepel', url: 'https://filmkoepel.nl/feed/' },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

function formatDay(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function decodeString(string) {
  return he.decode(string);
}

function parseFilmLength(filmLength) {
  var numberPattern = /\d+/g;
  var numericLength = String(filmLength).match(numberPattern);
  return `${numericLength} minutes`;
}

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

async function fetchWithRetry(url, options, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    console.warn(`  Attempt ${attempt}/${retries} failed: ${response.status}`);
    if (attempt < retries) await new Promise(r => setTimeout(r, attempt * 2000));
  }
  throw new Error(`Failed after ${retries} attempts`);
}

async function fetchFeed(feed) {
  console.log(`Fetching ${feed.name}...`);
  const response = await fetchWithRetry(feed.url, {
    headers: {
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
    },
  });
  const xml = await response.text();
  const data = parser.parse(xml);

  const films = [];
  const filmList = data.schedule?.film || [];
  const filmArray = Array.isArray(filmList) ? filmList : [filmList];

  for (const film of filmArray) {
    const showtimes = [];
    const cinema = film.cinema;

    if (cinema) {
      const showtimeList = cinema.showtime || [];
      const showtimeArray = Array.isArray(showtimeList) ? showtimeList : [showtimeList];

      for (const st of showtimeArray) {
        if (st.day && st.time) {
          showtimes.push({
            date: st.day,
            day: formatDay(st.day),
            datetime: `${st.day}T${st.time}`,
            time: st.time,
            ticketUrl: st.bookinglink || '',
            screen: st.screen || '',
          });
        }
      }
    }

    if (film.title && showtimes.length > 0) {
      films.push({
        title: decodeString(film.title),
        director: film.director || null,
        length: parseFilmLength(film.length) || null,
        posterUrl: film.posterlink || '',
        permalink: film.permalink || '',
        showtimes,
        _tmdbId: film.tmdb || null,
      });
    }
  }

  const needsPoster = films.filter(f => !f.posterUrl && f._tmdbId);
  if (needsPoster.length > 0) {
    console.log(`  Fetching ${needsPoster.length} posters from TMDB...`);
    await Promise.all(needsPoster.map(async (f) => {
      const url = await fetchTmdbPoster(f._tmdbId);
      if (url) f.posterUrl = url;
    }));
  }
  for (const f of films) delete f._tmdbId;

  console.log(`Found ${films.length} films with showtimes for ${feed.name}`);
  return { name: feed.name, films };
}

async function fetchAllCinemas() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const cinemas = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value.films.length > 0) {
      cinemas.push(result.value);
    } else if (result.status === 'rejected') {
      console.error(`Error fetching ${FEEDS[i].name}:`, result.reason.message);
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
