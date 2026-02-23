import {
  FilmWithCinemasLite,
  CinemaShowtimesLite,
  ShowtimeLite,
} from '../types';
import { filterPastShowtimes } from './date';

interface FilterOptions {
  cinemaFilter: string[];
  dayFilter: string[];
  filmFilter: string;
  genreFilter: string[];
  directorFilter: string;
  today: string;
  currentTime: string;
  recentlyAdded?: boolean;
  upcomingRelease?: boolean;
  recentlyReleased?: boolean;
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
  today: string,
  currentTime: string
): CinemaShowtimesLite[] {
  return cinemaShowtimes
    .filter(
      (cs) => cinemaFilter.length === 0 || cinemaFilter.includes(cs.cinema)
    )
    .map((cs) => ({
      ...cs,
      showtimes: filterPastShowtimes(
        filterShowtimesByDay(cs.showtimes, dayFilter, today),
        today,
        currentTime
      ),
    }))
    .filter((cs) => cs.showtimes.length > 0);
}

function isRecentlyAdded(
  dateAdded: string | null | undefined,
  today: string
): boolean {
  if (!dateAdded) return false;
  const addedDate = new Date(dateAdded);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 7;
}

function isUpcomingRelease(
  releaseDate: string | null | undefined,
  today: string
): boolean {
  if (!releaseDate) return false;
  return releaseDate > today;
}

function isRecentlyReleased(
  releaseDate: string | null | undefined,
  today: string
): boolean {
  if (!releaseDate) return false;
  if (releaseDate > today) return false;
  const release = new Date(releaseDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - release.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays <= 90; // Last 3 months
}

export function filterFilms(
  films: FilmWithCinemasLite[],
  options: FilterOptions
): FilmWithCinemasLite[] {
  const {
    cinemaFilter,
    dayFilter,
    filmFilter,
    genreFilter,
    directorFilter,
    today,
    currentTime,
    recentlyAdded,
    upcomingRelease,
    recentlyReleased,
  } = options;

  return films
    .filter((film) => !recentlyAdded || isRecentlyAdded(film.dateAdded, today))
    .filter(
      (film) => !upcomingRelease || isUpcomingRelease(film.releaseDate, today)
    )
    .filter(
      (film) => !recentlyReleased || isRecentlyReleased(film.releaseDate, today)
    )
    .filter((film) => matchesSearch(film.title, filmFilter))
    .filter(
      (film) =>
        genreFilter.length === 0 ||
        film.genres?.some((g) => genreFilter.includes(g))
    )
    .filter(
      (film) =>
        !directorFilter ||
        film.director?.toLowerCase() === directorFilter.toLowerCase()
    )
    .map((film) => ({
      ...film,
      cinemaShowtimes: filterCinemaShowtimes(
        film.cinemaShowtimes,
        cinemaFilter,
        dayFilter,
        today,
        currentTime
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
