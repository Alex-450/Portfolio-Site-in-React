import { formatDay, fetchWithRetry, decodeAndTrim } from './utils.mjs';

const FC_HYENA_URL = 'https://fchyena.nl/json/shows.json';

async function fetchFcHyena() {
  console.log('Fetching FC Hyena...');
  const response = await fetchWithRetry(FC_HYENA_URL, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; FilmListingsFetcher/1.0)',
    },
  });
  const data = await response.json();
  const filmMap = new Map();
  const currentYear = new Date().getFullYear();

  // Track seen show IDs to avoid duplicates
  const seenShowIds = new Set();
  for (const [, shows] of Object.entries(data.movies || {})) {
    for (const show of shows) {
      // Skip duplicates
      if (seenShowIds.has(show.id)) continue;
      seenShowIds.add(show.id);

      const key = show.productions?.[0] || show.name;
      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title: decodeAndTrim(show.display_name) || decodeAndTrim(show.name),
          director: null,
          length: show.duration ? `${show.duration} minutes` : null,
          posterUrl: '',
          permalink: '',
          showtimes: [],
          _needsTmdbSearch: true,
        });
      }

      const film = filmMap.get(key);
      // date_start is MMDD format, need to add year
      const mmdd = show.date_start;
      if (mmdd && show.time_start) {
        const month = mmdd.slice(0, 2);
        const day = mmdd.slice(2, 4);
        // Handle year rollover (if month is less than current month, it's next year)
        const currentMonth = new Date().getMonth() + 1;
        const year = parseInt(month) < currentMonth ? currentYear + 1 : currentYear;
        const date = `${year}-${month}-${day}`;

        film.showtimes.push({
          date,
          day: formatDay(date),
          datetime: `${date}T${show.time_start}`,
          time: show.time_start,
          ticketUrl: `https://tickets.fchyena.nl/fchyena/nl/flow_configs/fchy_1s/steps/start/show/${show.id}`,
          screen: show.room || '',
        });
      }
    }
  }

  const films = [...filmMap.values()].filter(f => f.showtimes.length > 0);
  console.log(`Found ${films.length} films with showtimes for FC Hyena`);
  return { name: 'FC Hyena', films };
}

export { fetchFcHyena };
