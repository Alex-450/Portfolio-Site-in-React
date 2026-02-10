import { useState } from 'react';
import Head from 'next/head';
import { Container } from 'react-bootstrap';
import { Cinema, FilmWithCinemas } from '../types';
import FilmCard from './FilmCard';
import PosterCarousel from './PosterCarousel';
import { getToday, formatDate } from '../utils/date';
import { filterFilms, filterFilmsBySearch } from '../utils/filmFilters';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function groupFilmsByCinema(cinemas: Cinema[]): FilmWithCinemas[] {
  const filmMap = new Map<string, FilmWithCinemas>();
  const usedSlugs = new Set<string>();

  for (const cinema of cinemas) {
    for (const film of cinema.films) {
      const key = film.title.toLowerCase();
      if (!filmMap.has(key)) {
        // Generate unique slug
        let slug = generateSlug(film.title);
        let counter = 1;
        while (usedSlugs.has(slug)) {
          slug = `${generateSlug(film.title)}-${counter}`;
          counter++;
        }
        usedSlugs.add(slug);

        filmMap.set(key, {
          slug,
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

  const today = getToday();
  const allFilms = groupFilmsByCinema(cinemas);

  const matchingFilms = filterFilmsBySearch(allFilms, filmSearch);

  const filteredFilms = filterFilms(allFilms, {
    cinemaFilter,
    dayFilter,
    filmSearch,
    filmFilter,
    today,
  });

  // Films for carousel: filtered by cinema and day, but not by film search
  const carouselFilms = filterFilms(allFilms, {
    cinemaFilter,
    dayFilter,
    filmSearch: '',
    filmFilter: '',
    today,
  });

  const allDates = new Set<string>();

  allFilms.forEach((film) => {
    film.cinemaShowtimes
      .filter((cs) => !cinemaFilter || cs.cinema === cinemaFilter)
      .forEach((cs) => {
        cs.showtimes.forEach((s) => {
          if (s.date !== today) allDates.add(s.date);
        });
      });
  });
  const dayOptions = Array.from(allDates)
    .sort()
    .map((date) => ({ value: date, label: formatDate(date) }));

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
          <p className="subtitle">
            Showtimes from <a href="https://www.lab111.nl/" target="_blank">LAB111</a>, <a href="https://studio-k.nu/" target="_blank">Studio K</a>, <a href="https://filmhallen.nl/" target="_blank">Filmhallen</a>, <a href="https://filmkoepel.nl/" target="_blank">Filmkoepel</a>, <a href="https://themovies.nl/" target="_blank">The Movies</a>, <a href="https://www.kriterion.nl/" target="_blank">Kriterion</a>, <a href="https://www.eyefilm.nl/en" target="_blank">Eye</a> & <a href="https://fchyena.nl/" target="_blank">FC Hyena</a>
          </p>
        </header>

        <PosterCarousel
          films={carouselFilms}
          onPosterClick={(title) => {
            setFilmSearch(title);
            setFilmFilter(title);
          }}
        />

        <div className="film-filters">
          <select
            value={cinemaFilter}
            onChange={(e) => setCinemaFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Cinemas</option>
            {cinemas.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Days</option>
            <option value="today">Today</option>
            {dayOptions.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
          <div className="film-search-container">
            <input
              type="text"
              value={filmSearch}
              onChange={(e) => {
                setFilmSearch(e.target.value);
                setFilmFilter('');
                setShowFilmDropdown(true);
              }}
              onFocus={() => setShowFilmDropdown(true)}
              onBlur={() => setTimeout(() => setShowFilmDropdown(false), 150)}
              placeholder="Search films..."
              className="filter-select filter-select-film"
            />
            {(showFilmDropdown || filmSearch) && (
              <button
                className="film-search-clear"
                onMouseDown={() => {
                  setFilmSearch('');
                  setFilmFilter('');
                }}
              >
                X
              </button>
            )}
            {showFilmDropdown && matchingFilms.length > 0 && (
              <ul className="film-search-dropdown">
                {matchingFilms.map((film) => (
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

        {cinemas.length === 0 && (
          <p className="no-results">No showtimes available</p>
        )}

        {filteredFilms.length === 0 && cinemas.length > 0 && (
          <p className="no-results">No showtimes found for selected filters</p>
        )}

        {filteredFilms.map((film) => (
          <FilmCard key={film.title} film={film} dayFilter={dayFilter} />
        ))}

        <footer className="tmdb-attribution">
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
            <img src="/tmdb-logo.svg" alt="TMDB" />
          </a>
        </footer>
      </Container>
    </>
  );
};

export default FilmListings;
