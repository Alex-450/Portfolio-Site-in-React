import { XMLParser } from 'fast-xml-parser';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const FEEDS = [
  { name: 'LAB111', url: 'https://www.lab111.nl/feed' },
  { name: 'Studio K', url: 'https://www.studio-k.nu/feed' },
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

async function fetchFeed(feed) {
  console.log(`Fetching ${feed.name}...`);
  const response = await fetch(feed.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed.name}: ${response.status}`);
  }
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
        title: film.title,
        director: film.director || null,
        length: film.length || null,
        posterUrl: film.posterlink || '',
        permalink: film.permalink || '',
        showtimes,
      });
    }
  }

  console.log(`Found ${films.length} films with showtimes`);
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
