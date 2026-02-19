import { FilmWithCinemasLite, CinemaShowtimesLite, ShowtimeLite } from '../types';

interface FilterOptions {
  cinemaFilter: string[];
  dayFilter: string[];
  filmSearch: string;
  filmFilter: string;
  genreFilter: string[];
  directorFilter: string;
  today: string;
}

function matchesSearch(title: string, search: string): boolean {
  return !search || title.toLowerCase().includes(search.toLowerCase());
}

function filterShowtimesByDay(
  showtimes: ShowtimeLite[],
  dayFilter: string[],
  today: string
): ShowtimeLite[] {
  if (dayFilter.length === 0) return showtimes;
  const targetDates = dayFilter.map((d) => (d === 'today' ? today : d));
  return showtimes.filter((s) => targetDates.includes(s.date));
}

function filterCinemaShowtimes(
  cinemaShowtimes: CinemaShowtimesLite[],
  cinemaFilter: string[],
  dayFilter: string[],
  today: string
): CinemaShowtimesLite[] {
  return cinemaShowtimes
    .filter((cs) => cinemaFilter.length === 0 || cinemaFilter.includes(cs.cinema))
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
  const { cinemaFilter, dayFilter, filmSearch, filmFilter, genreFilter, directorFilter, today } = options;

  return films
    .filter((film) => !filmFilter || film.title === filmFilter)
    .filter((film) => matchesSearch(film.title, filmSearch))
    .filter((film) =>
      genreFilter.length === 0 ||
      film.genres?.some((g) => genreFilter.includes(g))
    )
    .filter((film) => !directorFilter || film.director?.toLowerCase() === directorFilter.toLowerCase())
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
