import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { FilmWithCinemasLite, FilmsIndexLite } from '../types';
import FilmCard from './FilmCard';
import PosterCarousel from './PosterCarousel';
import ViewToggle from './ViewToggle';
import GenreCarouselRow from './GenreCarouselRow';
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

const str = (v: unknown) => (typeof v === 'string' ? v : '');

const GENRE_ORDER = [
  'Drama',
  'Romance',
  'Comedy',
  'Action',
  'Animation',
  'Science Fiction',
  'Horror',
  'Thriller',
  'Crime',
  'Music',
  'Adventure',
  'Mystery',
  'History',
  'Other',
];

function groupFilmsByGenre(films: FilmWithCinemasLite[]): Map<string, FilmWithCinemasLite[]> {
  const genreMap = new Map<string, FilmWithCinemasLite[]>();

  for (const film of films) {
    // Use only the first (primary) genre, or 'Other' if none
    const primaryGenre = film.genres?.[0] || 'Other';
    if (!genreMap.has(primaryGenre)) {
      genreMap.set(primaryGenre, []);
    }
    genreMap.get(primaryGenre)!.push(film);
  }

  // Sort by custom genre order, unlisted genres go to the end
  return new Map([...genreMap.entries()].sort((a, b) => {
    const indexA = GENRE_ORDER.indexOf(a[0]);
    const indexB = GENRE_ORDER.indexOf(b[0]);
    const orderA = indexA === -1 ? GENRE_ORDER.length : indexA;
    const orderB = indexB === -1 ? GENRE_ORDER.length : indexB;
    return orderA - orderB;
  }));
}

interface FilmListingsProps {
  filmsIndex: FilmsIndexLite;
}

const FilmListings = ({ filmsIndex }: FilmListingsProps) => {
  const router = useRouter();
  const q = router.query;

  // URL-synced filters
  const cinemaFilter = str(q.cinema);
  const dayFilter = str(q.day);
  const filmFilter = str(q.film);
  const genreFilter = str(q.genres).split(',').filter(Boolean);
  const directorFilter = str(q.director);
  const viewMode = (str(q.view) === 'carousel' ? 'carousel' : 'list') as 'list' | 'carousel';

  // Local search input state
  const [filmSearch, setFilmSearch] = useState(filmFilter);
  const [directorSearch, setDirectorSearch] = useState(directorFilter);

  useEffect(() => setFilmSearch(filmFilter), [filmFilter]);
  useEffect(() => setDirectorSearch(directorFilter), [directorFilter]);

  const setFilter = (key: string, value: string | string[] | undefined) => {
    const query = { ...q };
    if (!value || (Array.isArray(value) && !value.length)) {
      delete query[key];
    } else {
      query[key] = Array.isArray(value) ? value.join(',') : value;
    }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

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
    filmFilter: filmSearch,
    genreFilter,
    directorFilter,
    today,
  });

  const carouselFilms = filterFilms(allFilms, {
    cinemaFilter,
    dayFilter,
    filmSearch: '',
    filmFilter: filmFilter && dayFilter ? filmFilter : '',
    genreFilter,
    directorFilter,
    today,
  });

  // Films filtered by everything except day - used for computing day options
  const filmsForDayOptions = filterFilms(allFilms, {
    cinemaFilter,
    dayFilter: '',
    filmSearch,
    filmFilter,
    genreFilter,
    directorFilter,
    today,
  });
  const allDates = new Set<string>();
  filmsForDayOptions.forEach((film) => {
    film.cinemaShowtimes
      .filter((cs) => !cinemaFilter || cs.cinema === cinemaFilter)
      .forEach((cs) => {
        cs.showtimes.forEach((s) => {
          if (s.date !== today) allDates.add(s.date);
        });
      });
  });
  const hasShowtimesToday = filmsForDayOptions.some((film) =>
    film.cinemaShowtimes
      .filter((cs) => !cinemaFilter || cs.cinema === cinemaFilter)
      .some((cs) => cs.showtimes.some((s) => s.date === today))
  );
  const dayOptions = Array.from(allDates)
    .sort()
    .map((date) => ({ value: date, label: formatDate(date) }));

  // Clear day filter if it's no longer valid for the current selection
  const isDayFilterValid = !dayFilter ||
    (dayFilter === 'today' && hasShowtimesToday) ||
    dayOptions.some((d) => d.value === dayFilter);

  useEffect(() => {
    if (dayFilter && !isDayFilterValid) {
      setFilter('day', undefined);
    }
  }, [isDayFilterValid, dayFilter]);

  // Group films by genre for carousel view
  const filmsByGenre = useMemo(() => groupFilmsByGenre(filteredFilms), [filteredFilms]);

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
          <h1><Link href="/film-listings">Film Listings</Link></h1>
        </header>

        <div className="film-filters">
          <ViewToggle
            view={viewMode}
            onChange={(v) => setFilter('view', v === 'list' ? undefined : v)}
          />
        </div>

        {viewMode === 'list' && (
          <PosterCarousel
            films={carouselFilms}
            onPosterClick={(title) => {
              setFilmSearch(title);
              setFilter('film', title);
            }}
          />
        )}

        <div className="film-filters">
          <CinemaFilter
            value={cinemaFilter}
            onChange={(v) => setFilter('cinema', v)}
            cinemaNames={cinemaNames}
          />
          <DayFilter
            value={dayFilter}
            onChange={(v) => setFilter('day', v)}
            dayOptions={dayOptions}
            showToday={hasShowtimesToday}
          />
          <GenreFilter
            genres={allGenres}
            selectedGenres={genreFilter}
            onChange={(v) => setFilter('genres', v)}
          />
          {viewMode === 'list' && (
            <FilmSearchFilter
              films={allFilms}
              searchValue={filmSearch}
              onSearchChange={setFilmSearch}
              onSelect={(title) => {
                setFilmSearch(title);
                setFilter('film', title);
              }}
              onClear={() => {
                setFilmSearch('');
                setFilter('film', undefined);
              }}
            />
          )}
          <DirectorFilter
            directors={allDirectors}
            searchValue={directorSearch}
            onSearchChange={setDirectorSearch}
            onSelect={(d) => {
              setDirectorSearch(d);
              setFilter('director', d);
            }}
            onClear={() => {
              setDirectorSearch('');
              setFilter('director', undefined);
            }}
          />
        </div>

        {(cinemaFilter || dayFilter || genreFilter.length > 0 || filmFilter || directorFilter) && (
          <div className="active-filters">
            {cinemaFilter && (
              <button
                className="filter-chip"
                onClick={() => setFilter('cinema', undefined)}
              >
                {cinemaFilter} <span className="chip-remove">×</span>
              </button>
            )}
            {dayFilter && (
              <button
                className="filter-chip"
                onClick={() => setFilter('day', undefined)}
              >
                {dayFilter === 'today' ? 'Today' : formatDate(dayFilter)} <span className="chip-remove">×</span>
              </button>
            )}
            {genreFilter.map((genre) => (
              <button
                key={genre}
                className="filter-chip"
                onClick={() => setFilter('genres', genreFilter.filter((g) => g !== genre))}
              >
                {genre} <span className="chip-remove">×</span>
              </button>
            ))}
            {filmFilter && (
              <button
                className="filter-chip"
                onClick={() => {
                  setFilmSearch('');
                  setFilter('film', undefined);
                }}
              >
                Film: {filmFilter} <span className="chip-remove">×</span>
              </button>
            )}
            {directorFilter && (
              <button
                className="filter-chip"
                onClick={() => {
                  setDirectorSearch('');
                  setFilter('director', undefined);
                }}
              >
                Director: {directorFilter} <span className="chip-remove">×</span>
              </button>
            )}
            <button
              className="filter-chip clear-all"
              onClick={() => {
                setFilmSearch('');
                setDirectorSearch('');
                router.push({ pathname: router.pathname, query: viewMode === 'carousel' ? { view: 'carousel' } : {} }, undefined, { shallow: true });
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {allFilms.length === 0 && (
          <p className="no-results">No showtimes available</p>
        )}

        {filteredFilms.length === 0 && allFilms.length > 0 && !filmSearch && (
          <p className="no-results">No showtimes found for selected filters</p>
        )}

        {viewMode === 'list' ? (
          filteredFilms.map((film) => (
            <FilmCard key={film.title} film={film} dayFilter={dayFilter} />
          ))
        ) : (
          <div className="genre-carousel-section">
            {[...filmsByGenre.entries()].map(([genre, films]) => (
              <GenreCarouselRow key={genre} genre={genre} films={films} />
            ))}
          </div>
        )}

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
