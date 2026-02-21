import { useState, useMemo } from 'react';
import Link from 'next/link';
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

function FilmCard({ film, dayFilter, today, isInWatchlist, onToggleWatchlist }: FilmCardProps) {
  const [expanded, setExpanded] = useState(false);
  const showExpanded = expanded || dayFilter.length > 0;

  const hasHiddenDates = useMemo(() => {
    if (showExpanded) return false;
    return film.cinemaShowtimes.some(cs => {
      const filtered = filterByDay(groupShowtimesByDate(cs.showtimes), dayFilter, today);
      return filtered.length > 3;
    });
  }, [film.cinemaShowtimes, dayFilter, today, showExpanded]);

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
              aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {isInWatchlist ? '−' : '+'}
            </button>
          )}
        </div>
        {film.director && <div className="film-director">{film.director}</div>}
        {film.length && <div className="film-length">{film.length}</div>}

        <div className="cinema-showtimes">
          {film.cinemaShowtimes.map(cs => {
            const filteredGrouped = filterByDay(
              groupShowtimesByDate(cs.showtimes),
              dayFilter,
              today
            );

            if (filteredGrouped.length === 0) return null;

            const visibleDates = showExpanded
              ? filteredGrouped
              : filteredGrouped.slice(0, 3);

            const screens = new Set(cs.showtimes.map(s => s.screen).filter(Boolean));
            const singleScreen = screens.size === 1 ? [...screens][0] : null;

            return (
              <div key={`${cs.cinema}-${cs.variant || ''}`} className="cinema-showtime-group">
                <div className="cinema-name">
                  {cs.cinema}
                  {singleScreen && <span className="cinema-screen"> ({singleScreen})</span>}
                  {cs.variant && <span className="cinema-variant"> ({cs.variant})</span>}
                </div>
                <div className="showtimes">
                  {visibleDates.map(([date, times]) => {
                    const timesByScreen: Record<string, typeof times> = {};
                    for (const s of times) {
                      (timesByScreen[s.screen || ''] ??= []).push(s);
                    }

                    return Object.entries(timesByScreen).map(([screen, screenTimes]) => (
                      <div key={`${date}-${screen}`} className="showtime-group">
                        <div className={`showtime-date${!singleScreen && screen ? ' with-screen' : ''}`}>
                          {formatDate(date)}
                          {!singleScreen && screen && (
                            <span className="showtime-screen"> ({screen})</span>
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
                                  film.length,
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
                                📅
                              </a>
                            </span>
                          ))}
                        </div>
                      </div>
                    ));
                  })}
                </div>
              </div>
            );
          })}
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
