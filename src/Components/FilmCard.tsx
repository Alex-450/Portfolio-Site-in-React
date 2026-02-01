import { useState, useMemo } from 'react';
import { FilmWithCinemas, Showtime } from '../types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function groupShowtimesByDate(showtimes: Showtime[]): [string, Showtime[]][] {
  const grouped: Record<string, Showtime[]> = {};
  for (const s of showtimes) {
    (grouped[s.date] ??= []).push(s);
  }
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}

function filterByDay(
  grouped: [string, Showtime[]][],
  dayFilter: string,
  today: string
): [string, Showtime[]][] {
  if (!dayFilter) return grouped;
  if (dayFilter === 'today') return grouped.filter(([date]) => date === today);
  return grouped.filter(([date]) => date === dayFilter);
}

interface FilmCardProps {
  film: FilmWithCinemas;
  dayFilter: string;
}

function FilmCard({ film, dayFilter }: FilmCardProps) {
  const [expanded, setExpanded] = useState(false);
  const today = useMemo(getToday, []);
  const showExpanded = expanded || !!dayFilter;

  const hasHiddenDates = useMemo(() => {
    if (showExpanded) return false;
    return film.cinemaShowtimes.some(cs => {
      const filtered = filterByDay(groupShowtimesByDate(cs.showtimes), dayFilter, today);
      return filtered.length > 3;
    });
  }, [film.cinemaShowtimes, dayFilter, today, showExpanded]);

  return (
    <div className="film-card">
      {film.posterUrl ? (
        <img className="film-poster" src={film.posterUrl} alt={film.title} />
      ) : (
        <div className="film-poster-placeholder" />
      )}
      <div className="film-info">
        <div className="film-title">
          {film.permalink ? (
            <a href={film.permalink} target="_blank" rel="noopener noreferrer">
              {film.title}
            </a>
          ) : (
            film.title
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
              <div key={cs.cinema} className="cinema-showtime-group">
                <div className="cinema-name">
                  {cs.cinema}
                  {singleScreen && <span className="cinema-screen"> ({singleScreen})</span>}
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
                            <a
                              key={i}
                              href={s.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="showtime-link"
                            >
                              {s.time}
                            </a>
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
