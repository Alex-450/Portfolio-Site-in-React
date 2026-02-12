import { readFileSync } from 'fs';
import { join } from 'path';
import FilmListings from '../Components/FilmListings';
import { FilmsIndex, FilmsIndexLite } from '../types';

interface Props {
  filmsIndex: FilmsIndexLite;
}

export default function Page({ filmsIndex }: Props) {
  return <FilmListings filmsIndex={filmsIndex} />;
}

export function getStaticProps() {
  const filmsPath = join(process.cwd(), 'src/data/films.json');

  // Get current time in Amsterdam
  const now = new Date();
  const amsterdamTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' })
  );
  const today = amsterdamTime.toISOString().split('T')[0];
  const currentTime = amsterdamTime.toTimeString().slice(0, 5);

  let filmsIndex: FilmsIndexLite = {};
  try {
    const filmsData = readFileSync(filmsPath, 'utf-8');
    const fullIndex: FilmsIndex = JSON.parse(filmsData);

    // Strip out fields not needed for listings and filter past showtimes
    for (const [slug, film] of Object.entries(fullIndex)) {
      const cinemaShowtimes = film.cinemaShowtimes
        .map((cs) => ({
          cinema: cs.cinema,
          variant: cs.variant,
          showtimes: cs.showtimes
            .filter((s) => s.date > today || (s.date === today && s.time >= currentTime))
            .map((s) => ({
              date: s.date,
              time: s.time,
              ticketUrl: s.ticketUrl,
              screen: s.screen,
            })),
        }))
        .filter((cs) => cs.showtimes.length > 0);

      // Only include films that still have upcoming showtimes
      if (cinemaShowtimes.length > 0) {
        filmsIndex[slug] = {
          slug: film.slug,
          title: film.title,
          director: film.director,
          length: film.length,
          posterUrl: film.posterUrl,
          genres: film.tmdb?.genres ?? [],
          cinemaShowtimes,
        };
      }
    }
  } catch {
    // films.json may not exist yet
  }

  return {
    props: {
      filmsIndex,
    },
  };
}
