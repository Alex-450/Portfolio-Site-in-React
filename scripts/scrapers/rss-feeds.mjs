import { XMLParser } from 'fast-xml-parser';
import { formatDay, decodeAndTrim, parseFilmLength, fetchWithRetry } from './utils.mjs';

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

export async function fetchFeed(feed) {
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
        title: decodeAndTrim(film.title),
        director: film.director || null,
        length: parseFilmLength(film.length) || null,
        posterUrl: film.posterlink || '',
        permalink: film.permalink || '',
        showtimes,
        _tmdbId: film.tmdb || null,
      });
    }
  }

  console.log(`Found ${films.length} films with showtimes for ${feed.name}`);
  return { name: feed.name, films };
}

export async function fetchAllRssFeeds() {
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

export { FEEDS };