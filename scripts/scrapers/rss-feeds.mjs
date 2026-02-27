import { XMLParser } from 'fast-xml-parser';
import { decodeAndTrim, parseFilmLength, fetchWithRetry } from './utils.mjs';

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
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
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
      const showtimeArray = Array.isArray(showtimeList)
        ? showtimeList
        : [showtimeList];

      for (const st of showtimeArray) {
        if (st.day && st.time) {
          showtimes.push({
            date: st.day,
            time: st.time,
            ticketUrl: st.bookinglink || '',
            screen: st.screen || '',
          });
        }
      }
    }

    if (film.title && showtimes.length > 0) {
      // Normalize subtitle_lang to standard codes
      let subtitles = null;
      const subtitleLang = film.subtitle_lang?.toLowerCase?.() || '';
      if (
        subtitleLang.includes('nederland') ||
        subtitleLang === 'nl' ||
        subtitleLang === 'nld'
      ) {
        subtitles = 'NL';
      } else if (
        subtitleLang.includes('english') ||
        subtitleLang === 'en' ||
        subtitleLang === 'eng'
      ) {
        subtitles = 'EN';
      } else if (subtitleLang === 'geen' || subtitleLang === 'none') {
        subtitles = 'none';
      }

      // If no subtitle_lang field, try to extract from title
      if (!subtitles) {
        const titleLower = film.title.toLowerCase();
        if (/\(eng(lish)?\s*subs?\)/.test(titleLower)) {
          subtitles = 'EN';
        } else if (/\((nl|dutch)\s*subs?\)/.test(titleLower)) {
          subtitles = 'NL';
        }
      }

      // posterlink is often empty; fall back to images section (poster_tile_groot = 400x600)
      let posterUrl = film.posterlink || '';
      if (!posterUrl && film.images) {
        const imageSizes = Array.isArray(film.images.image_size)
          ? film.images.image_size
          : film.images.image_size
            ? [film.images.image_size]
            : [];
        const preferred = ['poster_tile_groot', 'poster_caroussel'];
        for (const id of preferred) {
          const img = imageSizes.find((i) => i['@_id'] === id);
          if (img?.['#text']?.trim()) {
            posterUrl = img['#text'].trim();
            break;
          }
        }
      }

      films.push({
        title: decodeAndTrim(film.title),
        director: film.director || null,
        length: parseFilmLength(film.length) || null,
        posterUrl,
        showtimes,
        subtitles,
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
