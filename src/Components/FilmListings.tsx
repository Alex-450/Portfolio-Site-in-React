import { useRef, useState } from 'react';
import Head from 'next/head';
import { Container } from 'react-bootstrap';
import { Cinema, FilmWithCinemas } from '../types';
import FilmCard from './FilmCard';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function groupFilmsByCinema(cinemas: Cinema[]): FilmWithCinemas[] {
  const filmMap = new Map<string, FilmWithCinemas>();

  for (const cinema of cinemas) {
    for (const film of cinema.films) {
      const key = film.title.toLowerCase();
      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title: film.title,
          director: film.director,
          length: film.length,
          posterUrl: film.posterUrl,
          permalink: film.permalink,
          cinemaShowtimes: [],
        });
      }
      const entry = filmMap.get(key)!;
      // Use poster/permalink if we didn't have one
      if (!entry.posterUrl && film.posterUrl) entry.posterUrl = film.posterUrl;
      if (!entry.permalink && film.permalink) entry.permalink = film.permalink;
      if (!entry.director && film.director) entry.director = film.director;
      if (!entry.length && film.length) entry.length = film.length;

      entry.cinemaShowtimes.push({
        cinema: cinema.name,
        showtimes: film.showtimes,
      });
    }
  }

  return [...filmMap.values()].sort((a, b) => a.title.localeCompare(b.title));
}

interface FilmListingsProps {
  cinemas: Cinema[];
}

const FilmListings = ({ cinemas }: FilmListingsProps) => {
  const [cinemaFilter, setCinemaFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [filmSearch, setFilmSearch] = useState('');
  const [filmFilter, setFilmFilter] = useState('');
  const [showFilmDropdown, setShowFilmDropdown] = useState(false);
  const filmInputRef = useRef<HTMLDivElement>(null);

  const today = getToday();
  const allFilms = groupFilmsByCinema(cinemas);

  const matchingFilms = allFilms.filter(
    film => !filmSearch || film.title.toLowerCase().includes(filmSearch.toLowerCase())
  );

  const filteredFilms = allFilms
    .filter(film => !filmFilter || film.title === filmFilter)
    .filter(film => !filmSearch || film.title.toLowerCase().includes(filmSearch.toLowerCase()))
    .map(film => {
      const filteredCinemaShowtimes = film.cinemaShowtimes
        .filter(cs => !cinemaFilter || cs.cinema === cinemaFilter)
        .map(cs => {
          if (!dayFilter) return cs;
          const filteredShowtimes = cs.showtimes.filter(s => {
            if (dayFilter === 'today') return s.date === today;
            return s.date === dayFilter;
          });
          return { ...cs, showtimes: filteredShowtimes };
        })
        .filter(cs => cs.showtimes.length > 0);

      return { ...film, cinemaShowtimes: filteredCinemaShowtimes };
    })
    .filter(film => film.cinemaShowtimes.length > 0);

  const allDates = new Set<string>();

  allFilms.forEach(film => {
    film.cinemaShowtimes
      .filter(cs => !cinemaFilter || cs.cinema === cinemaFilter)
      .forEach(cs => {
        cs.showtimes.forEach(s => {
          if (s.date !== today) allDates.add(s.date);
        });
      });
  });
  const dayOptions = Array.from(allDates).sort().map(date => {
    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return { value: date, label };
  });

  return (
    <>
      <Head>
        <title>Film Listings | a-450</title>
        <meta
          name="description"
          content="Amsterdam cinema showtimes from LAB111, Studio K, Filmhallen, Filmkoepel & The Movies"
        />
        <meta property="og:title" content="Film Listings | a-450" />
        <meta
          property="og:description"
          content="Amsterdam cinema showtimes from LAB111, Studio K, Filmhallen, Filmkoepel & The Movies"
        />
        <meta property="og:type" content="website" />
      </Head>
      <Container className="film-listings-container">
        <header className="film-listings-header">
          <h1>Film Listings</h1>
          <p className="subtitle">Showtimes from LAB111, Studio K, Filmhallen, Filmkoepel & The Movies</p>
        </header>

      <div className="film-filters">
        <select
          value={cinemaFilter}
          onChange={e => setCinemaFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Cinemas</option>
          {cinemas.map(c => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={dayFilter}
          onChange={e => setDayFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Days</option>
          <option value="today">Today</option>
          {dayOptions.map(day => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        <div className="film-search-container" ref={filmInputRef}>
          <input
            type="text"
            value={filmSearch}
            onChange={e => {
              setFilmSearch(e.target.value);
              setFilmFilter('');
              setShowFilmDropdown(true);
            }}
            onFocus={() => setShowFilmDropdown(true)}
            onBlur={() => setTimeout(() => setShowFilmDropdown(false), 150)}
            placeholder="Search films..."
            className="filter-select filter-select-film"
          />
          {showFilmDropdown && matchingFilms.length > 0 && (
            <ul className="film-search-dropdown">
              {matchingFilms.map(film => (
                <li
                  key={film.title}
                  onMouseDown={() => {
                    setFilmSearch(film.title);
                    setFilmFilter(film.title);
                    setShowFilmDropdown(false);
                  }}
                >
                  {film.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {cinemas.length === 0 && <p className="no-results">No showtimes available</p>}

      {filteredFilms.length === 0 && cinemas.length > 0 && (
        <p className="no-results">No showtimes found for selected filters</p>
      )}

      {filteredFilms.map(film => (
        <FilmCard key={film.title} film={film} dayFilter={dayFilter} />
      ))}
    </Container>
    </>
  );
};

export default FilmListings;
