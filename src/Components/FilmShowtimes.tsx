import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { CinemaShowtimes } from '../types';
import { formatDate, getToday, groupShowtimesByDate } from '../utils/date';
import { generateCalendarUrlFromFilm } from '../utils/calendar';
import DayFilter from './filters/DayFilter';

const toArray = (v: unknown): string[] => {
  if (Array.isArray(v))
    return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') return [v];
  return [];
};

interface FilmShowtimesProps {
  cinemaShowtimes: CinemaShowtimes[];
  filmTitle: string;
  filmLength: string | null;
}

function FilmShowtimes({
  cinemaShowtimes,
  filmTitle,
  filmLength,
}: FilmShowtimesProps) {
  const router = useRouter();
  const today = useMemo(getToday, []);
  const dayFilter = toArray(router.query.day);

  const setDayFilter = (value: string[]) => {
    const query = { ...router.query };
    if (value.length === 0) {
      delete query.day;
    } else {
      query.day = value;
    }
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    });
  };

  // Check if there are showtimes today
  const hasShowtimesToday = useMemo(() => {
    return cinemaShowtimes.some((cs) =>
      cs.showtimes.some((s) => s.date === today)
    );
  }, [cinemaShowtimes, today]);

  // Compute day options from all showtimes (excluding today, which is shown separately)
  const dayOptions = useMemo(() => {
    const dates = new Set<string>();
    cinemaShowtimes.forEach((cs) => {
      cs.showtimes.forEach((s) => {
        if (s.date >= today && s.date !== today) dates.add(s.date);
      });
    });
    return Array.from(dates)
      .sort()
      .map((date) => ({ value: date, label: formatDate(date) }));
  }, [cinemaShowtimes, today]);

  return (
    <div className="cinema-showtimes cinema-showtimes-detail">
      <div className="film-detail-day-filter">
        <DayFilter
          selectedDays={dayFilter}
          onChange={setDayFilter}
          dayOptions={dayOptions}
          showToday={hasShowtimesToday}
        />
      </div>
      {cinemaShowtimes.map((cs) => {
        const grouped = groupShowtimesByDate(cs.showtimes);
        // Filter out past dates and apply day filter
        const filtered = grouped.filter(([date]) => {
          if (date < today) return false;
          if (dayFilter.length === 0) return true;
          if (dayFilter.includes('today') && date === today) return true;
          return dayFilter.includes(date);
        });

        if (filtered.length === 0) return null;

        const screens = new Set(
          cs.showtimes.map((s) => s.screen).filter(Boolean)
        );
        const singleScreen = screens.size === 1 ? [...screens][0] : null;

        return (
          <div
            key={`${cs.cinema}-${cs.variant || ''}`}
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
                  ({cs.subtitles})
                </span>
              )}
            </div>
            <div className="showtimes">
              {filtered.map(([date, times]) => {
                const timesByScreen: Record<string, typeof times> = {};
                for (const s of times) {
                  (timesByScreen[s.screen || ''] ??= []).push(s);
                }

                return Object.entries(timesByScreen).map(
                  ([screen, screenTimes]) => (
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
                                filmTitle,
                                filmLength,
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
                  )
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FilmShowtimes;
