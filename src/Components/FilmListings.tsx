import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FilmWithCinemasLite, FilmsIndexLite } from '../types';
import FilmCard from './FilmCard';
import PosterCarousel from './PosterCarousel';
import TopFilmsBar from './TopFilmsBar';
import ComingSoonBar from './ComingSoonBar';
import PreviewsBar from './PreviewsBar';
import FilmBarToggle, { FilmBarTab } from './FilmBarToggle';
import ViewToggle from './ViewToggle';
import GenreCarouselRow from './GenreCarouselRow';
import CinemaFilter from './filters/CinemaFilter';
import DayFilter from './filters/DayFilter';
import DirectorFilter from './filters/DirectorFilter';
import GenreFilter from './filters/GenreFilter';
import FilmSearchFilter from './filters/FilmSearchFilter';
import ReleaseFilter, {
  ReleaseFilterValue,
  RELEASE_OPTIONS,
} from './filters/ReleaseFilter';
import TimeFilter from './filters/TimeFilter';
import WatchlistFilter from './filters/WatchlistFilter';
import {
  getToday,
  getCurrentTime,
  formatDate,
  previewFilms,
  comingSoonFilms,
} from '../utils/date';
import { filterFilms, filterFilmsBySearch } from '../utils/filmFilters';
import { useWatchlist } from '../hooks/useWatchlist';
import { cinemas, getCinemaSlug } from '../data/cinemas';

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

function groupFilmsByGenre(
  films: FilmWithCinemasLite[]
): Map<string, FilmWithCinemasLite[]> {
  const genreMap = new Map<string, FilmWithCinemasLite[]>();

  for (const film of films) {
    const primaryGenre = film.genres?.[0] || 'Other';
    if (!genreMap.has(primaryGenre)) {
      genreMap.set(primaryGenre, []);
    }
    genreMap.get(primaryGenre)!.push(film);
  }

  // Sort by film count descending; "Other" always sorts last as the catch-all.
  return new Map(
    [...genreMap.entries()].sort(([genreA, filmsA], [genreB, filmsB]) => {
      if (genreA === 'Other') return 1;
      if (genreB === 'Other') return -1;
      return filmsB.length - filmsA.length;
    })
  );
}

interface FilmListingsProps {
  filmsIndex: FilmsIndexLite;
}

const FilmListings = ({ filmsIndex }: FilmListingsProps) => {
  const router = useRouter();
  const q = router.query;
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

  // URL-synced filters — memoized to keep stable references for useMemo deps
  const cinemaRaw = str(q.cinema);
  const dayRaw = str(q.day);
  const genresRaw = str(q.genres);
  const cinemaFilter = useMemo(
    () => cinemaRaw.split(',').filter(Boolean),
    [cinemaRaw]
  );
  const dayFilter = useMemo(() => dayRaw.split(',').filter(Boolean), [dayRaw]);
  const genreFilter = useMemo(
    () => genresRaw.split(',').filter(Boolean),
    [genresRaw]
  );
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

  // Shared base: everything filtered/sorted except the free-text film search and watchlist.
  // The carousel uses this directly (it ignores film search to remain clickable);
  // the list view applies film search and watchlist on top.
  const baseFilms = useMemo(() => {
    let films = filterFilms(allFilms, {
      cinemaFilter,
      dayFilter,
      timeFilter,
      filmFilter: '',
      genreFilter,
      directorFilter,
      today,
      currentTime,
      recentlyAdded: releaseFilter === 'recently-added',
      upcomingRelease: releaseFilter === 'upcoming',
      recentlyReleased: releaseFilter === 'recently-released',
      reRelease: releaseFilter === 're-releases',
    });

    if (releaseFilter === 'recently-released') {
      films = [...films].sort((a, b) =>
        (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')
      );
    } else if (
      releaseFilter === 'upcoming' ||
      releaseFilter === 're-releases'
    ) {
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
    genreFilter,
    directorFilter,
    today,
    currentTime,
    releaseFilter,
  ]);

  const filteredFilms = useMemo(() => {
    let films = filmSearch
      ? filterFilmsBySearch(baseFilms, filmSearch)
      : baseFilms;
    if (watchlistFilter) {
      films = films.filter((film) => watchlist.includes(film.slug));
    }
    return films;
  }, [baseFilms, filmSearch, watchlistFilter, watchlist]);

  // Carousel ignores film search so users can click posters to filter.
  // Exception: when a day filter is active alongside a film filter, keep the film filter
  // so the carousel highlights only films showing on that specific day.
  const carouselFilms = useMemo(
    () =>
      filmFilter && dayFilter.length > 0
        ? filterFilmsBySearch(baseFilms, filmFilter)
        : baseFilms,
    [baseFilms, filmFilter, dayFilter]
  );

  const hasActiveFilters =
    cinemaFilter.length > 0 ||
    dayFilter.length > 0 ||
    !!timeFilter ||
    genreFilter.length > 0 ||
    !!filmFilter ||
    !!directorFilter ||
    !!releaseFilter ||
    watchlistFilter;

  // Count of filters tucked behind the collapsible "Filters" panel.
  // Film search stays at the top level, so it's excluded here. Tonight is
  // composed of the day + time filters, which are already counted below.
  const advancedFilterCount =
    cinemaFilter.length +
    dayFilter.length +
    (timeFilter ? 1 : 0) +
    genreFilter.length +
    (directorFilter ? 1 : 0) +
    (releaseFilter ? 1 : 0) +
    (watchlistFilter ? 1 : 0);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filmBarTab, setFilmBarTab] = useState<FilmBarTab>('this-week');

  const hasPreviews = useMemo(
    () => previewFilms(allFilms, today).length > 0,
    [allFilms, today]
  );
  const hasComingSoon = useMemo(
    () => comingSoonFilms(allFilms, today).length > 0,
    [allFilms, today]
  );

  // If the selected tab has nothing to show, fall back to This Week so an empty
  // tab is never displayed.
  useEffect(() => {
    if (
      (filmBarTab === 'previews' && !hasPreviews) ||
      (filmBarTab === 'coming-soon' && !hasComingSoon)
    ) {
      setFilmBarTab('this-week');
    }
  }, [filmBarTab, hasPreviews, hasComingSoon]);

  // Films filtered by everything except day - used for computing day options
  const { dayOptions, hasShowtimesToday, hasEveningShowtimesToday } =
    useMemo(() => {
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

        {!hasActiveFilters && (
          <div className="film-bar-section">
            {(hasPreviews || hasComingSoon) && (
              <FilmBarToggle
                tab={filmBarTab}
                onChange={setFilmBarTab}
                showPreviews={hasPreviews}
                showComingSoon={hasComingSoon}
              />
            )}
            {filmBarTab === 'this-week' && (
              <TopFilmsBar
                films={allFilms}
                today={today}
                showLabel={false}
                emptyMessage="No showings scheduled this week"
              />
            )}
            {filmBarTab === 'coming-soon' && (
              <ComingSoonBar
                films={allFilms}
                today={today}
                showLabel={false}
                emptyMessage="No upcoming releases in the next month"
              />
            )}
            {filmBarTab === 'previews' && (
              <PreviewsBar
                films={allFilms}
                today={today}
                showLabel={false}
                emptyMessage="No preview screenings scheduled"
              />
            )}
          </div>
        )}

        <h2 className="film-listings-section-heading">All Films</h2>

        <div className="film-filters">
          <ViewToggle
            view={viewMode}
            onChange={(v) => setFilter('view', v === 'list' ? undefined : v)}
          />
        </div>

        {viewMode === 'list' && (
          <PosterCarousel films={carouselFilms} today={today} linkToDetail />
        )}

        <div className="film-filters film-filters-primary">
          {viewMode === 'list' && (
            <FilmSearchFilter
              films={allFilms}
              searchValue={filmSearch}
              onSearchChange={setFilmSearch}
              onSelect={(film) => router.push(`/films/${film.slug}/`)}
              onClear={() => {
                setFilmSearch('');
                setFilter('film', undefined);
              }}
            />
          )}
          <button
            className={`filter-select filters-toggle${advancedFilterCount > 0 ? ' filter-toggle-active' : ''}`}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="advanced-filters"
          >
            <span>
              Filters
              {advancedFilterCount > 0 && ` (${advancedFilterCount})`}
            </span>
            {filtersOpen ? (
              <ChevronUp size={16} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} aria-hidden="true" />
            )}
          </button>
        </div>

        {filtersOpen && (
          <div id="advanced-filters" className="film-filters film-filters-panel">
            {hasEveningShowtimesToday && (
              <button
                className={`filter-select${isTonightActive ? ' filter-toggle-active' : ''}`}
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
        )}

        {hasActiveFilters && (
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
            <button className="filter-chip clear-all" onClick={clearWatchlist}>
              Clear watchlist
            </button>
          </div>
        )}

        {allFilms.length === 0 && (
          <p className="no-results">No showtimes available</p>
        )}

        {filteredFilms.length === 0 && allFilms.length > 0 && (
          <p className="no-results">
            {filmSearch
              ? `No showtimes found for "${filmSearch}"`
              : 'No showtimes found for selected filters'}
          </p>
        )}

        {viewMode === 'list' ? (
          filteredFilms.map((film) => (
            <FilmCard
              key={film.title}
              film={film}
              dayFilter={dayFilter}
              today={today}
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
            {Object.entries(cinemas).map(([key, cinema], i, arr) => (
              <span key={key}>
                {i > 0 && i < arr.length - 1 && ', '}
                {i > 0 && i === arr.length - 1 && ' & '}
                <Link href={`/cinemas/${getCinemaSlug(key)}/`}>
                  {cinema.name}
                </Link>
              </span>
            ))}
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
