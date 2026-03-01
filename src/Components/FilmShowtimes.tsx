import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { CinemaShowtimes } from '../types';
import { formatDate, getToday, getCurrentTime } from '../utils/date';
import { generateCalendarUrlFromFilm } from '../utils/calendar';

interface ShowtimeWithCinema {
  time: string;
  ticketUrl: string;
  screen: string;
  cinema: string;
  variant?: string | null;
  subtitles?: string | null;
}

interface FilmShowtimesProps {
  cinemaShowtimes: CinemaShowtimes[];
  filmTitle: string;
  filmLength: number | null;
}

function FilmShowtimes({
  cinemaShowtimes,
  filmTitle,
  filmLength,
}: FilmShowtimesProps) {
  const today = useMemo(getToday, []);
  const currentTime = useMemo(getCurrentTime, []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Group all showtimes by date, filtering out past showtimes
  const showtimesByDate = useMemo(() => {
    const byDate = new Map<string, ShowtimeWithCinema[]>();

    for (const cs of cinemaShowtimes) {
      for (const s of cs.showtimes) {
        // Skip past dates
        if (s.date < today) continue;
        // Skip past times for today
        if (s.date === today && s.time < currentTime) continue;

        if (!byDate.has(s.date)) {
          byDate.set(s.date, []);
        }
        byDate.get(s.date)!.push({
          time: s.time,
          ticketUrl: s.ticketUrl,
          screen: s.screen,
          cinema: cs.cinema,
          variant: cs.variant,
          subtitles: cs.subtitles,
        });
      }
    }

    // Sort each day's showtimes by time
    for (const [, showtimes] of byDate) {
      showtimes.sort((a, b) => a.time.localeCompare(b.time));
    }

    // Return sorted by date
    return new Map(
      [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [cinemaShowtimes, today]);

  const dates = useMemo(() => [...showtimesByDate.keys()], [showtimesByDate]);

  // Auto-select first day if none selected
  const activeDay =
    selectedDay && dates.includes(selectedDay) ? selectedDay : dates[0];

  const activeShowtimes = activeDay
    ? showtimesByDate.get(activeDay) || []
    : [];

  if (dates.length === 0) {
    return <p className="no-results">No upcoming showtimes</p>;
  }

  return (
    <div className="film-showtimes-by-day">
      <div className="day-tabs">
        {dates.map((date) => (
          <button
            key={date}
            className={`day-tab${date === activeDay ? ' day-tab-active' : ''}`}
            onClick={() => setSelectedDay(date)}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      <div className="day-showtimes">
        {activeShowtimes.map((s, i) => (
          <div key={i} className="showtime-row">
            <span className="showtime-time">{s.time}</span>
            <span className="showtime-cinema">
              {s.cinema}
              {s.variant && (
                <span className="cinema-variant"> ({s.variant})</span>
              )}
              {s.subtitles && s.subtitles !== 'none' && (
                <span
                  className="cinema-subtitles"
                  title={
                    s.subtitles === 'EN'
                      ? 'English subtitles'
                      : s.subtitles === 'NL'
                        ? 'Dutch subtitles'
                        : `${s.subtitles} subtitles`
                  }
                >
                  {' '}
                  ({s.subtitles} SUBS)
                </span>
              )}
            </span>
            <span className="showtime-actions">
              <a
                href={s.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="showtime-link"
                title="Buy tickets"
              >
                Tickets
              </a>
              <a
                href={generateCalendarUrlFromFilm(
                  filmTitle,
                  filmLength,
                  s.cinema,
                  activeDay!,
                  s.time,
                  s.variant
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="calendar-link"
                title="Add to Google Calendar"
              >
                <Calendar size={16} />
              </a>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FilmShowtimes;
