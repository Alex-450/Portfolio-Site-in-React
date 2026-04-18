import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { FilmWithCinemasLite, FilmsIndexLite } from '../types';
import FilmCard from './FilmCard';
import PosterCarousel from './PosterCarousel';
import TopFilmsBar from './TopFilmsBar';
import ViewToggle from './ViewToggle';
import GenreCarouselRow from './GenreCarouselRow';
import CinemaFilter from './filters/CinemaFilter';
import DayFilter from './filters/DayFilter';
import DirectorFilter from './filters/DirectorFilter';
import GenreFilter from './filters/GenreFilter';
import FilmSearchFilter from './filters/FilmSearchFilter';
import ReleaseFilter, { ReleaseFilterValue, RELEASE_OPTIONS } from './filters/ReleaseFilter';
import TimeFilter from './filters/TimeFilter';
import WatchlistFilter from './filters/WatchlistFilter';
import { getToday, getCurrentTime, formatDate } from '../utils/date';
import { filterFilms } from '../utils/filmFilters';
import { useWatchlist } from '../hooks/useWatchlist';

function filmsIndexToList(filmsIndex: FilmsIndexLite): FilmWithCinemasLite[] {
  return Object.values(filmsIndex).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
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

function groupFilmsByGenre(
  films: FilmWithCinemasLite[]
): Map<string, FilmWithCinemasLite[]> {
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
  return new Map(
    [...genreMap.entries()].sort((a, b) => {
      const indexA = GENRE_ORDER.indexOf(a[0]);
      const indexB = GENRE_ORDER.indexOf(b[0]);
      const orderA = indexA === -1 ? GENRE_ORDER.length : indexA;
      const orderB = indexB === -1 ? GENRE_ORDER.length : indexB;
      return orderA - orderB;
    })
  );
}

interface FilmListingsProps {
  filmsIndex: FilmsIndexLite;
}

const FilmListings = ({ filmsIndex }: FilmListingsProps) => {
  const router = useRouter();
  const q = router.query;
  const { watchlist, isInWatchlist, toggleWatchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

  // URL-synced filters — memoized to keep stable references for useMemo deps
  const cinemaRaw = str(q.cinema);
  const dayRaw = str(q.day);
  const genresRaw = str(q.genres);
  const cinemaFilter = useMemo(() => cinemaRaw.split(',').filter(Boolean), [cinemaRaw]);
  const dayFilter = useMemo(() => dayRaw.split(',').filter(Boolean), [dayRaw]);
  const genreFilter = useMemo(() => genresRaw.split(',').filter(Boolean), [genresRaw]);
  const filmFilter = str(q.film);
  const directorFilter = str(q.director);
  const releaseFilter = (str(q.release) || null) as ReleaseFilterValue;
  const timeFilter = str(q.time) || null;
  const viewMode = (str(q.view) === 'carousel' ? 'carousel' : 'list') as
    | 'list'
    | 'carousel';
  const watchlistFilter = str(q.watchlist) === 'true';

  // Local search input state
  const [filmSearch, setFilmSearch] = useState(filmFilter);
  const [directorSearch, setDirectorSearch] = useState(directorFilter);

  useEffect(() => setFilmSearch(filmFilter), [filmFilter]);
  useEffect(() => setDirectorSearch(directorFilter), [directorFilter]);

  const setFilter = useCallback(
    (key: string, value: string | string[] | undefined) => {
      const query = { ...router.query };
      if (!value || (Array.isArray(value) && !value.length)) {
        delete query[key];
      } else {
        query[key] = Array.isArray(value) ? value.join(',') : value;
      }
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const today = useMemo(() => getToday(), []);
  const currentTime = useMemo(() => getCurrentTime(), []);
  const allFilms = useMemo(() => filmsIndexToList(filmsIndex), [filmsIndex]);
  const cinemaNames = useMemo(() => getCinemaNames(filmsIndex), [filmsIndex]);
  const allGenres = useMemo(
    () => [...new Set(allFilms.flatMap((f) => f.genres || []))].sort(),
    [allFilms]
  );
  const allDirectors = useMemo(
    () =>
      [
        ...new Map(
          allFilms
            .map((f) => f.director)
            .filter((d): d is string => d !== null)
            .map((d) => [d.toLowerCase(), d])
        ).values(),
      ].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    [allFilms]
  );

  const filteredFilms = useMemo(() => {
    let films = filterFilms(allFilms, {
      cinemaFilter,
      dayFilter,
      timeFilter,
      filmFilter: filmSearch,
      genreFilter,
      directorFilter,
      today,
      currentTime,
      recentlyAdded: releaseFilter === 'recently-added',
      upcomingRelease: releaseFilter === 'upcoming',
      recentlyReleased: releaseFilter === 'recently-released',
      reRelease: releaseFilter === 're-releases',
    });

    // Apply watchlist filter
    if (watchlistFilter) {
      films = films.filter((film) => watchlist.includes(film.slug));
    }

    // Sort by release date when release filters are active
    if (releaseFilter === 'recently-released') {
      // Most recent first (descending)
      films = [...films].sort((a, b) =>
        (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')
      );
    } else if (releaseFilter === 'upcoming') {
      // Closest to today first (ascending)
      films = [...films].sort((a, b) =>
        (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '')
      );
    } else if (releaseFilter === 're-releases') {
      // Oldest first (ascending by release date)
      films = [...films].sort((a, b) =>
        (a.releaseDate ?? '').localeCompare(b.releaseDate ?? '')
      );
    }

    return films;
  }, [
    allFilms,
    cinemaFilter,
    dayFilter,
    timeFilter,
    filmSearch,
    genreFilter,
    directorFilter,
    today,
    currentTime,
    releaseFilter,
    watchlistFilter,
    watchlist,
  ]);

  // Carousel shows all matching films (ignoring film search) so users can click posters to filter.
  // Exception: when a day filter is active alongside a film filter, we keep the film filter
  // so the carousel highlights only films showing on that specific day.
  const carouselFilms = useMemo(
    () =>
      filterFilms(allFilms, {
        cinemaFilter,
        dayFilter,
        timeFilter,
        filmFilter: filmFilter && dayFilter.length > 0 ? filmFilter : '',
        genreFilter,
        directorFilter,
        today,
        currentTime,
        recentlyAdded: releaseFilter === 'recently-added',
        upcomingRelease: releaseFilter === 'upcoming',
        recentlyReleased: releaseFilter === 'recently-released',
        reRelease: releaseFilter === 're-releases',
      }),
    [
      allFilms,
      cinemaFilter,
      dayFilter,
      timeFilter,
      filmFilter,
      genreFilter,
      directorFilter,
      today,
      currentTime,
      releaseFilter,
    ]
  );

  // Films filtered by everything except day - used for computing day options
  const { dayOptions, hasShowtimesToday, hasEveningShowtimesToday } = useMemo(() => {
    const filmsForDayOptions = filterFilms(allFilms, {
      cinemaFilter,
      dayFilter: [],
      timeFilter: null,
      filmFilter,
      genreFilter,
      directorFilter,
      today,
      currentTime,
      recentlyAdded: releaseFilter === 'recently-added',
      upcomingRelease: releaseFilter === 'upcoming',
      recentlyReleased: releaseFilter === 'recently-released',
      reRelease: releaseFilter === 're-releases',
    });
    const allDates = new Set<string>();
    filmsForDayOptions.forEach((film) => {
      film.cinemaShowtimes.forEach((cs) => {
        cs.showtimes.forEach((s) => {
          if (s.date !== today) allDates.add(s.date);
        });
      });
    });
    const hasShowtimesToday = filmsForDayOptions.some((film) =>
      film.cinemaShowtimes.some((cs) =>
        cs.showtimes.some((s) => s.date === today)
      )
    );
    const hasEveningShowtimesToday = filmsForDayOptions.some((film) =>
      film.cinemaShowtimes.some((cs) =>
        cs.showtimes.some((s) => s.date === today && s.time >= '18:00')
      )
    );
    const dayOptions = Array.from(allDates)
      .sort()
      .map((date) => ({ value: date, label: formatDate(date) }));
    return { dayOptions, hasShowtimesToday, hasEveningShowtimesToday };
  }, [
    allFilms,
    cinemaFilter,
    timeFilter,
    filmFilter,
    genreFilter,
    directorFilter,
    today,
    currentTime,
    releaseFilter,
  ]);

  // Clear invalid day filters
  const validDayValues = useMemo(() => {
    const values = new Set(['today', ...dayOptions.map((d) => d.value)]);
    if (!hasShowtimesToday) values.delete('today');
    return values;
  }, [dayOptions, hasShowtimesToday]);

  useEffect(() => {
    const invalidDays = dayFilter.filter((d) => !validDayValues.has(d));
    if (invalidDays.length > 0) {
      const validDays = dayFilter.filter((d) => validDayValues.has(d));
      setFilter('day', validDays.length > 0 ? validDays : undefined);
    }
  }, [dayFilter, validDayValues, setFilter]);

  // Group films by genre for carousel view
  const filmsByGenre = useMemo(
    () => groupFilmsByGenre(filteredFilms),
    [filteredFilms]
  );

  const isTonightActive =
    dayFilter.length === 1 &&
    dayFilter[0] === 'today' &&
    timeFilter === '18:00';

  const toggleTonight = useCallback(() => {
    if (isTonightActive) {
      // Clear both day and time filters
      const query = { ...router.query };
      delete query.day;
      delete query.time;
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    } else {
      const query = { ...router.query, day: 'today', time: '18:00' };
      router.push({ pathname: router.pathname, query }, undefined, {
        shallow: true,
      });
    }
  }, [isTonightActive, router]);

  // Helper to get day label
  const getDayLabel = (day: string) => {
    if (day === 'today') return 'Today';
    const option = dayOptions.find((d) => d.value === day);
    return option ? option.label : day;
  };

  return (
    <>
      <Head>
        <title>Film Listings | a-450</title>
        <meta
          name="description"
          content="Amsterdam cinema showtimes from LAB111, Studio K, The Movies & more"
        />
        <meta property="og:title" content="Film Listings | a-450" />
        <meta
          property="og:description"
          content="Amsterdam cinema showtimes from LAB111, Studio K, The Movies & more"
        />
        <meta property="og:type" content="website" />
      </Head>
      <Container className="film-listings-container">
        <header className="film-listings-header">
          <h1>
            <Link href="/film-listings">Film Listings</Link>
          </h1>
        </header>

        {!cinemaFilter.length && !dayFilter.length && !timeFilter && !genreFilter.length && !filmFilter && !directorFilter && !releaseFilter && !watchlistFilter && (
          <TopFilmsBar films={allFilms} today={today} />
        )}

        <h2 className="film-listings-section-heading">All Films</h2>

        <div className="film-filters">
          <ViewToggle
            view={viewMode}
            onChange={(v) => setFilter('view', v === 'list' ? undefined : v)}
          />
        </div>

        {viewMode === 'list' && (
          <PosterCarousel
            films={carouselFilms}
            today={today}
            linkToDetail
          />
        )}

        <div className="film-filters">
          {hasEveningShowtimesToday && (
            <button
              className={`tonight-button${isTonightActive ? ' active' : ''}`}
              onClick={toggleTonight}
            >
              Tonight
            </button>
          )}
          <CinemaFilter
            selectedCinemas={cinemaFilter}
            onChange={(v) => setFilter('cinema', v)}
            cinemaNames={cinemaNames}
          />
          <DayFilter
            selectedDays={dayFilter}
            onChange={(v) => setFilter('day', v)}
            dayOptions={dayOptions}
            showToday={hasShowtimesToday}
          />
          <TimeFilter
            value={timeFilter}
            onChange={(value) => setFilter('time', value ?? undefined)}
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
          <ReleaseFilter
            value={releaseFilter}
            onChange={(value) => setFilter('release', value ?? undefined)}
          />
          <WatchlistFilter
            enabled={watchlistFilter}
            onChange={(enabled) =>
              setFilter('watchlist', enabled ? 'true' : undefined)
            }
            watchlistCount={watchlist.length}
          />
        </div>

        {(cinemaFilter.length > 0 ||
          dayFilter.length > 0 ||
          timeFilter ||
          genreFilter.length > 0 ||
          filmFilter ||
          directorFilter ||
          releaseFilter ||
          watchlistFilter) && (
          <div className="active-filters">
            {cinemaFilter.map((cinema) => (
              <button
                key={cinema}
                className="filter-chip"
                onClick={() =>
                  setFilter(
                    'cinema',
                    cinemaFilter.filter((c) => c !== cinema)
                  )
                }
              >
                {cinema} <span className="chip-remove">×</span>
              </button>
            ))}
            {dayFilter.map((day) => (
              <button
                key={day}
                className="filter-chip"
                onClick={() =>
                  setFilter(
                    'day',
                    dayFilter.filter((d) => d !== day)
                  )
                }
              >
                {getDayLabel(day)} <span className="chip-remove">×</span>
              </button>
            ))}
            {timeFilter && (
              <button
                className="filter-chip"
                onClick={() => setFilter('time', undefined)}
              >
                From {timeFilter} <span className="chip-remove">×</span>
              </button>
            )}
            {genreFilter.map((genre) => (
              <button
                key={genre}
                className="filter-chip"
                onClick={() =>
                  setFilter(
                    'genres',
                    genreFilter.filter((g) => g !== genre)
                  )
                }
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
                Director: {directorFilter}{' '}
                <span className="chip-remove">×</span>
              </button>
            )}
            {releaseFilter && (
              <button
                className="filter-chip"
                onClick={() => setFilter('release', undefined)}
              >
                {RELEASE_OPTIONS.find((o) => o.value === releaseFilter)?.label}{' '}
                <span className="chip-remove">×</span>
              </button>
            )}
            {watchlistFilter && (
              <button
                className="filter-chip"
                onClick={() => setFilter('watchlist', undefined)}
              >
                Watchlist <span className="chip-remove">×</span>
              </button>
            )}
            <button
              className="filter-chip clear-all"
              onClick={() => {
                setFilmSearch('');
                setDirectorSearch('');
                router.push(
                  {
                    pathname: router.pathname,
                    query: viewMode === 'carousel' ? { view: 'carousel' } : {},
                  },
                  undefined,
                  { shallow: true }
                );
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {watchlistFilter && watchlist.length > 0 && (
          <div className="watchlist-management">
            <span className="watchlist-management-label">Manage watchlist</span>
            {watchlist.map((slug) => (
              <button
                key={slug}
                className="filter-chip"
                onClick={() => removeFromWatchlist(slug)}
                aria-label={`Remove ${filmsIndex[slug]?.title ?? slug} from watchlist`}
              >
                {filmsIndex[slug]?.title ?? slug.replace(/-/g, ' ')}{' '}
                <span className="chip-remove">×</span>
              </button>
            ))}
            <button
              className="filter-chip clear-all"
              onClick={clearWatchlist}
            >
              Clear watchlist
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
            <FilmCard
              key={film.title}
              film={film}
              dayFilter={dayFilter}
              today={today}
              isInWatchlist={isInWatchlist(film.slug)}
              onToggleWatchlist={() => toggleWatchlist(film.slug)}
            />
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
            Showtimes from{' '}
            <a href="https://www.lab111.nl/" target="_blank" rel="noopener noreferrer">
              LAB111
            </a>
            ,{' '}
            <a href="https://studio-k.nu/" target="_blank" rel="noopener noreferrer">
              Studio K
            </a>
            ,{' '}
            <a href="https://filmhallen.nl/" target="_blank" rel="noopener noreferrer">
              Filmhallen
            </a>
            ,{' '}
            <a href="https://filmkoepel.nl/" target="_blank" rel="noopener noreferrer">
              Filmkoepel
            </a>
            ,{' '}
            <a href="https://themovies.nl/" target="_blank" rel="noopener noreferrer">
              The Movies
            </a>
            ,{' '}
            <a href="https://www.eyefilm.nl/en" target="_blank" rel="noopener noreferrer">
              Eye
            </a>{' '}
            &{' '}
            <a href="https://fchyena.nl/" target="_blank" rel="noopener noreferrer">
              FC Hyena
            </a>{' '}
            &{' '}
            <a href="https://kriterion.nl/" target="_blank" rel="noopener noreferrer">
              Kriterion
            </a>
          </p>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="tmdb-link"
          >
            <img src="/tmdb-logo.svg" alt="TMDB" />
          </a>
        </footer>
      </Container>
    </>
  );
};

export default FilmListings;
