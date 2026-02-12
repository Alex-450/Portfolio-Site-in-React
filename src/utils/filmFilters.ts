import { FilmWithCinemasLite, CinemaShowtimesLite, ShowtimeLite } from '../types';

interface FilterOptions {
  cinemaFilter: string;
  dayFilter: string;
  filmSearch: string;
  filmFilter: string;
  genreFilter: string[];
  today: string;
}

function matchesSearch(title: string, search: string): boolean {
  return !search || title.toLowerCase().includes(search.toLowerCase());
}

function filterShowtimesByDay(
  showtimes: ShowtimeLite[],
  dayFilter: string,
  today: string
): ShowtimeLite[] {
  if (!dayFilter) return showtimes;
  const targetDate = dayFilter === 'today' ? today : dayFilter;
  return showtimes.filter((s) => s.date === targetDate);
}

function filterCinemaShowtimes(
  cinemaShowtimes: CinemaShowtimesLite[],
  cinemaFilter: string,
  dayFilter: string,
  today: string
): CinemaShowtimesLite[] {
  return cinemaShowtimes
    .filter((cs) => !cinemaFilter || cs.cinema === cinemaFilter)
    .map((cs) => ({
      ...cs,
      showtimes: filterShowtimesByDay(cs.showtimes, dayFilter, today),
    }))
    .filter((cs) => cs.showtimes.length > 0);
}

export function filterFilms(
  films: FilmWithCinemasLite[],
  options: FilterOptions
): FilmWithCinemasLite[] {
  const { cinemaFilter, dayFilter, filmSearch, filmFilter, genreFilter, today } = options;

  return films
    .filter((film) => !filmFilter || film.title === filmFilter)
    .filter((film) => matchesSearch(film.title, filmSearch))
    .filter((film) =>
      genreFilter.length === 0 ||
      film.genres?.some((g) => genreFilter.includes(g))
    )
    .map((film) => ({
      ...film,
      cinemaShowtimes: filterCinemaShowtimes(
        film.cinemaShowtimes,
        cinemaFilter,
        dayFilter,
        today
      ),
    }))
    .filter((film) => film.cinemaShowtimes.length > 0);
}

export function filterFilmsBySearch(
  films: FilmWithCinemasLite[],
  search: string
): FilmWithCinemasLite[] {
  return films.filter((film) => matchesSearch(film.title, search));
}
