import { useState } from 'react';
import Head from 'next/head';
import { Container } from 'react-bootstrap';
import { FilmWithCinemasLite, FilmsIndexLite } from '../types';
import FilmCard from './FilmCard';
import PosterCarousel from './PosterCarousel';
import CinemaFilter from './filters/CinemaFilter';
import DayFilter from './filters/DayFilter';
import DirectorFilter from './filters/DirectorFilter';
import GenreFilter from './filters/GenreFilter';
import FilmSearchFilter from './filters/FilmSearchFilter';
import { getToday, formatDate } from '../utils/date';
import { filterFilms } from '../utils/filmFilters';

function filmsIndexToList(filmsIndex: FilmsIndexLite): FilmWithCinemasLite[] {
  return Object.values(filmsIndex).sort((a, b) => a.title.localeCompare(b.title));
}

function getCinemaNames(filmsIndex: FilmsIndexLite): string[] {
  const cinemas = new Set<string>();
  for (const film of Object.values(filmsIndex)) {
    for (const cs of film.cinemaShowtimes) {
      cinemas.add(cs.cinema);
    }
  }
  return [...cinemas].sort();
}

interface FilmListingsProps {
  filmsIndex: FilmsIndexLite;
}

const FilmListings = ({ filmsIndex }: FilmListingsProps) => {
  const [cinemaFilter, setCinemaFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [filmSearch, setFilmSearch] = useState('');
  const [filmFilter, setFilmFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState<string[]>([]);
  const [directorSearch, setDirectorSearch] = useState('');
  const [directorFilter, setDirectorFilter] = useState('');

  const today = getToday();
  const allFilms = filmsIndexToList(filmsIndex);
  const cinemaNames = getCinemaNames(filmsIndex);
  const allGenres = [...new Set(allFilms.flatMap((f) => f.genres || []))].sort();
  const allDirectors = [...new Map(
    allFilms
      .map((f) => f.director)
      .filter((d): d is string => d !== null)
      .map((d) => [d.toLowerCase(), d])
  ).values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const filteredFilms = filterFilms(allFilms, {
    cinemaFilter,
    dayFilter,
    filmSearch,
    filmFilter,
    genreFilter,
    directorFilter,
    today,
  });

  // Films for carousel: filtered by cinema and day, but not by film search
  const carouselFilms = filterFilms(allFilms, {
    cinemaFilter,
    dayFilter,
    filmSearch: '',
    filmFilter: '',
    genreFilter,
    directorFilter,
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
        </header>

        <PosterCarousel
          films={carouselFilms}
          onPosterClick={(title) => {
            setFilmSearch(title);
            setFilmFilter(title);
          }}
        />

        <div className="film-filters">
          <CinemaFilter
            value={cinemaFilter}
            onChange={setCinemaFilter}
            cinemaNames={cinemaNames}
          />
          <DayFilter
            value={dayFilter}
            onChange={setDayFilter}
            dayOptions={dayOptions}
          />
          <GenreFilter
            genres={allGenres}
            selectedGenres={genreFilter}
            onChange={setGenreFilter}
          />
          <FilmSearchFilter
            films={allFilms}
            searchValue={filmSearch}
            onSearchChange={(value) => {
              setFilmSearch(value);
              setFilmFilter('');
            }}
            onSelect={(title) => {
              setFilmSearch(title);
              setFilmFilter(title);
            }}
            onClear={() => {
              setFilmSearch('');
              setFilmFilter('');
            }}
          />
          <DirectorFilter
            directors={allDirectors}
            searchValue={directorSearch}
            onSearchChange={(value) => {
              setDirectorSearch(value);
              setDirectorFilter('');
            }}
            onSelect={(director) => {
              setDirectorSearch(director);
              setDirectorFilter(director);
            }}
            onClear={() => {
              setDirectorSearch('');
              setDirectorFilter('');
            }}
          />
        </div>

        {allFilms.length === 0 && (
          <p className="no-results">No showtimes available</p>
        )}

        {filteredFilms.length === 0 && allFilms.length > 0 && (
          <p className="no-results">No showtimes found for selected filters</p>
        )}

        {filteredFilms.map((film) => (
          <FilmCard key={film.title} film={film} dayFilter={dayFilter} />
        ))}

        <footer className="film-listings-footer">
          <p className="cinema-sources">
            Showtimes from <a href="https://www.lab111.nl/" target="_blank">LAB111</a>, <a href="https://studio-k.nu/" target="_blank">Studio K</a>, <a href="https://filmhallen.nl/" target="_blank">Filmhallen</a>, <a href="https://filmkoepel.nl/" target="_blank">Filmkoepel</a>, <a href="https://themovies.nl/" target="_blank">The Movies</a>, <a href="https://www.kriterion.nl/" target="_blank">Kriterion</a>, <a href="https://www.eyefilm.nl/en" target="_blank">Eye</a> & <a href="https://fchyena.nl/" target="_blank">FC Hyena</a>
          </p>
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="tmdb-link">
            <img src="/tmdb-logo.svg" alt="TMDB" />
          </a>
        </footer>
      </Container>
    </>
  );
};

export default FilmListings;
