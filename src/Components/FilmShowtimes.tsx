import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { CinemaShowtimes } from '../types';
import { formatDate, getToday, getCurrentTime } from '../utils/date';
import { generateCalendarUrlFromFilm } from '../utils/calendar';
import { getCinemaSlug } from '../data/cinemas';

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
  // Optional: restrict the day tabs to these dates (e.g. the listings day filter).
  // The literal 'today' is resolved to the current date.
  dayFilter?: string[];
  // Optional: cap the number of showtimes shown per day, with a "Show more" toggle.
  // Omitted (e.g. on the detail page) means show all.
  maxPerDay?: number;
}

function FilmShowtimes({
  cinemaShowtimes,
  filmTitle,
  filmLength,
  dayFilter,
  maxPerDay,
}: FilmShowtimesProps) {
  const today = useMemo(getToday, []);
  const currentTime = useMemo(getCurrentTime, []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Dates the day filter restricts us to, with 'today' resolved. Empty/undefined = no restriction.
  const allowedDates = useMemo(
    () =>
      dayFilter && dayFilter.length > 0
        ? new Set(dayFilter.map((d) => (d === 'today' ? today : d)))
        : null,
    [dayFilter, today]
  );

  // Group all showtimes by date, filtering out past showtimes
  const showtimesByDate = useMemo(() => {
    const byDate = new Map<string, ShowtimeWithCinema[]>();

    for (const cs of cinemaShowtimes) {
      for (const s of cs.showtimes) {
        // Skip past dates
        if (s.date < today) continue;
        // Skip past times for today
        if (s.date === today && s.time < currentTime) continue;
        // Skip dates excluded by the day filter
        if (allowedDates && !allowedDates.has(s.date)) continue;

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
  }, [cinemaShowtimes, today, currentTime, allowedDates]);

  const dates = useMemo(() => [...showtimesByDate.keys()], [showtimesByDate]);

  // Auto-select first day if none selected
  const activeDay =
    selectedDay && dates.includes(selectedDay) ? selectedDay : dates[0];

  const activeShowtimes = activeDay
    ? showtimesByDate.get(activeDay) || []
    : [];

  const isCapped =
    maxPerDay != null && !expanded && activeShowtimes.length > maxPerDay;
  const visibleShowtimes = isCapped
    ? activeShowtimes.slice(0, maxPerDay)
    : activeShowtimes;

  const selectDay = (date: string) => {
    setSelectedDay(date);
    setExpanded(false); // collapse again when switching days
  };

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
            onClick={() => selectDay(date)}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      <div className="day-showtimes">
        {visibleShowtimes.map((s) => (
          <div
            key={`${s.cinema}-${s.time}-${s.screen ?? ''}-${s.variant ?? ''}`}
            className="showtime-row"
          >
            <span className="showtime-time">{s.time}</span>
            <span className="showtime-cinema">
              <Link href={`/cinemas/${getCinemaSlug(s.cinema)}/`}>{s.cinema}</Link>
              {s.screen && (
                <span className="cinema-screen"> - {s.screen}</span>
              )}
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

      {isCapped && (
        <button
          className="showtimes-show-more"
          onClick={() => setExpanded(true)}
        >
          Show {activeShowtimes.length - maxPerDay!} more
        </button>
      )}
    </div>
  );
}

export default FilmShowtimes;
