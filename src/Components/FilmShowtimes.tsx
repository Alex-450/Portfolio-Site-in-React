import { useMemo } from 'react';
import { CinemaShowtimes } from '../types';
import { formatDate, getToday, groupShowtimesByDate } from '../utils/date';

interface FilmShowtimesProps {
  cinemaShowtimes: CinemaShowtimes[];
}

function FilmShowtimes({ cinemaShowtimes }: FilmShowtimesProps) {
  const today = useMemo(getToday, []);

  return (
    <div className="cinema-showtimes cinema-showtimes-detail">
      {cinemaShowtimes.map((cs) => {
        const grouped = groupShowtimesByDate(cs.showtimes);
        // Filter out past dates
        const filtered = grouped.filter(([date]) => date >= today);

        if (filtered.length === 0) return null;

        const screens = new Set(cs.showtimes.map((s) => s.screen).filter(Boolean));
        const singleScreen = screens.size === 1 ? [...screens][0] : null;

        return (
          <div key={`${cs.cinema}-${cs.variant || ''}`} className="cinema-showtime-group">
            <div className="cinema-name">
              {cs.cinema}
              {singleScreen && <span className="cinema-screen"> ({singleScreen})</span>}
              {cs.variant && <span className="cinema-variant"> ({cs.variant})</span>}
            </div>
            <div className="showtimes">
              {filtered.map(([date, times]) => {
                const timesByScreen: Record<string, typeof times> = {};
                for (const s of times) {
                  (timesByScreen[s.screen || ''] ??= []).push(s);
                }

                return Object.entries(timesByScreen).map(([screen, screenTimes]) => (
                  <div key={`${date}-${screen}`} className="showtime-group">
                    <div
                      className={`showtime-date${!singleScreen && screen ? ' with-screen' : ''}`}
                    >
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
  );
}

export default FilmShowtimes;
