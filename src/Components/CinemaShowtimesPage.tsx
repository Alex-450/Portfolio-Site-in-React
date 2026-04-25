import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { FilmWithCinemasLite } from '../types';
import { formatDate, getToday, getCurrentTime } from '../utils/date';
import { generateCalendarUrlFromFilm } from '../utils/calendar';

interface ShowtimeWithFilm {
  time: string;
  ticketUrl: string;
  filmTitle: string;
  filmSlug: string;
  filmRuntime: number | null;
  cinemaKey: string;
  variant?: string | null;
  subtitles?: string | null;
}

interface CinemaShowtimesPageProps {
  films: FilmWithCinemasLite[];
  cinemaKey: string;
}

function CinemaShowtimesPage({ films, cinemaKey }: CinemaShowtimesPageProps) {
  const today = useMemo(getToday, []);
  const currentTime = useMemo(getCurrentTime, []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const showtimesByDate = useMemo(() => {
    const byDate = new Map<string, ShowtimeWithFilm[]>();

    for (const film of films) {
      for (const cs of film.cinemaShowtimes) {
        if (cs.cinema !== cinemaKey) continue;
        for (const s of cs.showtimes) {
          if (s.date < today) continue;
          if (s.date === today && s.time < currentTime) continue;

          if (!byDate.has(s.date)) {
            byDate.set(s.date, []);
          }
          byDate.get(s.date)!.push({
            time: s.time,
            ticketUrl: s.ticketUrl,
            filmTitle: film.title,
            filmSlug: film.slug,
            filmRuntime: film.runtime,
            cinemaKey: cs.cinema,
            variant: cs.variant,
            subtitles: cs.subtitles,
          });
        }
      }
    }

    for (const [, showtimes] of byDate) {
      showtimes.sort((a, b) => a.time.localeCompare(b.time));
    }

    return new Map(
      [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [films, cinemaKey, today]);

  const dates = useMemo(() => [...showtimesByDate.keys()], [showtimesByDate]);

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
        {activeShowtimes.map((s) => (
          <div
            key={`${s.filmSlug}-${s.time}-${s.variant ?? ''}`}
            className="showtime-row"
          >
            <span className="showtime-time">{s.time}</span>
            <span className="showtime-cinema">
              <Link href={`/films/${s.filmSlug}/`}>{s.filmTitle}</Link>
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
                  s.filmTitle,
                  s.filmRuntime,
                  s.cinemaKey,
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

export default CinemaShowtimesPage;
