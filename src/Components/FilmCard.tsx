import { useState } from 'react';
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
  showtimes.forEach(s => {
    if (!grouped[s.date]) {
      grouped[s.date] = [];
    }
    grouped[s.date].push(s);
  });
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}

interface FilmCardProps {
  film: FilmWithCinemas;
  dayFilter: string;
}

function FilmCard({ film, dayFilter }: FilmCardProps) {
  const [expanded, setExpanded] = useState(false);
  const today = getToday();
  const showExpanded = expanded || !!dayFilter;

  // Check if any cinema has hidden dates
  const hasHiddenDates =
    !showExpanded &&
    film.cinemaShowtimes.some(cs => {
      const grouped = groupShowtimesByDate(cs.showtimes);
      const filteredGrouped = grouped.filter(([date]) => {
        if (!dayFilter) return true;
        if (dayFilter === 'today') return date === today;
        return date === dayFilter;
      });
      return filteredGrouped.length > 3;
    });

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
            const grouped = groupShowtimesByDate(cs.showtimes);
            const filteredGrouped = grouped.filter(([date]) => {
              if (!dayFilter) return true;
              if (dayFilter === 'today') return date === today;
              return date === dayFilter;
            });

            if (filteredGrouped.length === 0) return null;

            const upcoming = filteredGrouped.slice(0, 3);
            const later = filteredGrouped.slice(3);

            return (
              <div key={cs.cinema} className="cinema-showtime-group">
                <div className="cinema-name">{cs.cinema}</div>
                <div className="showtimes">
                  {upcoming.map(([date, times]) => (
                    <div key={date} className="showtime-group">
                      <div className="showtime-date">{formatDate(date)}</div>
                      <div className="showtime-times">
                        {times.map((s, i) => (
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
                  ))}
                  {showExpanded &&
                    later.map(([date, times]) => (
                      <div key={date} className="showtime-group">
                        <div className="showtime-date">{formatDate(date)}</div>
                        <div className="showtime-times">
                          {times.map((s, i) => (
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
                    ))}
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
