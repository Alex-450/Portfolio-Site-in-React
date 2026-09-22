import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FilmWithCinemasLite, FilmsIndexLite } from '../types';
import FilmCard from './FilmCard';
import CinemaBar from './CinemaBar';
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
  previewFilms,
  comingSoonFilms,
  sortByNextShowtime,
} from '../utils/date';
import { filterFilms, filterFilmsBySearch } from '../utils/filmFilters';
import { useWatchlist } from '../hooks/useWatchlist';
import { useDayFilter, ALL_DAYS } from '../hooks/useDayFilter';
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
  const genresRaw = str(q.genres);
  const cinemaFilter = useMemo(
    () => cinemaRaw.split(',').filter(Boolean),
    [cinemaRaw]
  );
  const genreFilter = useMemo(
    () => genresRaw.split(',').filter(Boolean),
    [genresRaw]
  );
  const filmFilter = str(q.film);
  const directorFilter = str(q.director);
  const releaseFilter = (str(q.release) || null) as ReleaseFilterValue;
  const timeFilter = str(q.time) || null;
  const viewMode = (str(q.view) === 'carousel' ? 'carousel' : 'list') as
    'list' | 'carousel';
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

  // Films matching every filter *except* day/time — the set the day dropdown
  // offers days from, so it never lists a day the other filters can't satisfy.
  const filmsIgnoringDay = useMemo(
    () =>
      filterFilms(allFilms, {
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
      }),
    [
      allFilms,
      cinemaFilter,
      filmFilter,
      genreFilter,
      directorFilter,
      today,
      currentTime,
      releaseFilter,
    ]
  );

  const {
    dayFilter,
    selectedDays,
    defaultDay,
    isDefaultDay,
    dayOptions,
    hasShowtimesToday,
    hasEveningShowtimesToday,
    setDayFilter,
    getDayLabel,
  } = useDayFilter({
    filmsIgnoringDay,
    today,
    currentTime,
  });

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
    } else {
      // Default ordering: what's starting soonest comes first.
      films = sortByNextShowtime(films);
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

  // The default day doesn't count as a *user-chosen* filter, so it alone
  // doesn't replace the film bars with a filtered view. It is still surfaced
  // as a chip below, so a narrowed list is never unexplained.
  // `dayCleared` is likewise not a narrowing — it widens to all days — so it
  // doesn't belong here either.
  const hasActiveFilters =
    cinemaFilter.length > 0 ||
    selectedDays.length > 0 ||
    !!timeFilter ||
    genreFilter.length > 0 ||
    !!filmFilter ||
    !!directorFilter ||
    !!releaseFilter ||
    watchlistFilter;

  // Count of filters tucked behind the collapsible "Filters" panel.
  // Film search stays at the top level, so it's excluded here. Tonight is
  // composed of the day + time filters, which are already counted below.
  // The default day counts too — it's constraining the results, so the badge
  // should say so. Clearing it isn't a filter, so it adds nothing.
  const advancedFilterCount =
    cinemaFilter.length +
    (isDefaultDay ? 1 : 0) +
    selectedDays.length +
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

  // Group films by genre for carousel view
  const filmsByGenre = useMemo(
    () => groupFilmsByGenre(filteredFilms),
    [filteredFilms]
  );

  const isTonightActive =
    selectedDays.length === 1 &&
    selectedDays[0] === 'today' &&
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

        <CinemaBar />

        <h2 className="film-listings-section-heading">All Films</h2>

        <div className="film-filters">
          <ViewToggle
            view={viewMode}
            onChange={(v) => setFilter('view', v === 'list' ? undefined : v)}
          />
        </div>

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
          <div
            id="advanced-filters"
            className="film-filters film-filters-panel"
          >
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
              onChange={setDayFilter}
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

        {(hasActiveFilters || isDefaultDay) && (
          <div className="active-filters">
            {isDefaultDay && (
              <button className="filter-chip" onClick={() => setDayFilter([])}>
                {getDayLabel(defaultDay as string)}{' '}
                <span className="chip-remove">×</span>
              </button>
            )}
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
            {selectedDays.map((day) => (
              <button
                key={day}
                className="filter-chip"
                onClick={() =>
                  setDayFilter(selectedDays.filter((d) => d !== day))
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
                // Clearing everything has to include the default day, so the
                // `all` sentinel goes in explicitly — an empty query would let
                // the default re-apply and leave a Today chip standing.
                router.push(
                  {
                    pathname: router.pathname,
                    query: {
                      day: ALL_DAYS,
                      ...(viewMode === 'carousel' ? { view: 'carousel' } : {}),
                    },
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
