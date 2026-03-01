import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { FilmWithCinemasLite } from '../types';
import { formatDate, groupShowtimesByDate, filterByDay } from '../utils/date';
import { generateCalendarUrlFromFilm } from '../utils/calendar';

interface FilmCardProps {
  film: FilmWithCinemasLite;
  dayFilter: string[];
  today: string;
  isInWatchlist?: boolean;
  onToggleWatchlist?: () => void;
}

function FilmCard({
  film,
  dayFilter,
  today,
  isInWatchlist,
  onToggleWatchlist,
}: FilmCardProps) {
  const [expanded, setExpanded] = useState(false);
  const showExpanded = expanded || dayFilter.length > 0;

  // Memoize filtered showtimes to avoid recomputing on every render
  const filteredCinemaShowtimes = useMemo(() => {
    return film.cinemaShowtimes
      .map((cs) => {
        const filteredGrouped = filterByDay(
          groupShowtimesByDate(cs.showtimes),
          dayFilter,
          today
        );
        const screens = new Set(
          cs.showtimes.map((s) => s.screen).filter(Boolean)
        );
        const singleScreen = screens.size === 1 ? [...screens][0] : null;
        return { cs, filteredGrouped, singleScreen };
      })
      .filter(({ filteredGrouped }) => filteredGrouped.length > 0);
  }, [film.cinemaShowtimes, dayFilter, today]);

  const hasHiddenDates = useMemo(() => {
    if (showExpanded) return false;
    return filteredCinemaShowtimes.some(
      ({ filteredGrouped }) => filteredGrouped.length > 3
    );
  }, [filteredCinemaShowtimes, showExpanded]);

  return (
    <div className="film-card">
      <Link href={`/films/${film.slug}/`}>
        {film.posterUrl ? (
          <img className="film-poster" src={film.posterUrl} alt={film.title} />
        ) : (
          <div className="film-poster-placeholder" />
        )}
      </Link>
      <div className="film-info">
        <div className="film-title-row">
          <div className="film-title">
            <Link href={`/films/${film.slug}/`}>{film.title}</Link>
          </div>
          {onToggleWatchlist && (
            <button
              className={`watchlist-icon${isInWatchlist ? ' watchlist-icon-active' : ''}`}
              onClick={onToggleWatchlist}
              aria-label={
                isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'
              }
            >
              {isInWatchlist ? '−' : '+'}
            </button>
          )}
        </div>
        {film.director && (
          <div className="film-director">
            <Link href={`/film-listings?director=${encodeURIComponent(film.director)}`}>
              {film.director}
            </Link>
          </div>
        )}
        <div className="film-meta">
          {film.runtime && <span className="film-length">{film.runtime} minutes</span>}
          {film.releaseYear && <span className="film-year">({film.releaseYear})</span>}
        </div>

        <div className="cinema-showtimes">
          {filteredCinemaShowtimes.map(
            ({ cs, filteredGrouped, singleScreen }) => {
              const visibleDates = showExpanded
                ? filteredGrouped
                : filteredGrouped.slice(0, 3);

              return (
                <div
                  key={`${cs.cinema}-${film.slug}-${cs.variant || ''}-${cs.subtitles || ''}`}
                  className="cinema-showtime-group"
                >
                  <div className="cinema-name">
                    {cs.cinema}
                    {singleScreen && (
                      <span className="cinema-screen"> ({singleScreen})</span>
                    )}
                    {cs.variant && (
                      <span className="cinema-variant"> ({cs.variant})</span>
                    )}
                    {cs.subtitles && cs.subtitles !== 'none' && (
                      <span
                        className="cinema-subtitles"
                        title={
                          cs.subtitles === 'EN'
                            ? 'English subtitles'
                            : cs.subtitles === 'NL'
                              ? 'Dutch subtitles'
                              : `${cs.subtitles} subtitles`
                        }
                      >
                        {' '}
                        ({cs.subtitles} SUBS)
                      </span>
                    )}
                  </div>
                  <div className="showtimes">
                    {visibleDates.map(([date, times]) => {
                      const timesByScreen: Record<string, typeof times> = {};
                      for (const s of times) {
                        (timesByScreen[s.screen || ''] ??= []).push(s);
                      }

                      return Object.entries(timesByScreen).map(
                        ([screen, screenTimes]) => (
                          <div
                            key={`${date}-${screen}`}
                            className="showtime-group"
                          >
                            <div
                              className={`showtime-date${!singleScreen && screen ? ' with-screen' : ''}`}
                            >
                              {formatDate(date)}
                              {!singleScreen && screen && (
                                <span className="showtime-screen">
                                  {' '}
                                  ({screen})
                                </span>
                              )}
                            </div>
                            <div className="showtime-times">
                              {screenTimes.map((s, i) => (
                                <span key={i} className="showtime-item">
                                  <a
                                    href={s.ticketUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="showtime-link"
                                    title="Buy tickets"
                                  >
                                    {s.time}
                                  </a>
                                  <a
                                    href={generateCalendarUrlFromFilm(
                                      film.title,
                                      film.runtime,
                                      cs.cinema,
                                      s.date,
                                      s.time,
                                      cs.variant
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="calendar-link"
                                    title="Add to Google Calendar"
                                  >
                                    <Calendar size={16} />
                                  </a>
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
        {hasHiddenDates && (
          <button className="expand-btn" onClick={() => setExpanded(true)}>
            More dates
          </button>
        )}
      </div>
    </div>
  );
}

export default FilmCard;
