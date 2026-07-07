import { Showtime, FilmWithCinemasLite } from '../types';

// Date `days` days after `from` (YYYY-MM-DD), as YYYY-MM-DD.
export function addDays(from: string, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Earliest showtime date for a film (YYYY-MM-DD), or null if it has none.
export function firstShowtimeDate(
  film: FilmWithCinemasLite
): string | null {
  let earliest: string | null = null;
  for (const cs of film.cinemaShowtimes) {
    for (const s of cs.showtimes) {
      if (earliest === null || s.date < earliest) earliest = s.date;
    }
  }
  return earliest;
}

// Number of a film's showtimes falling within [start, end] inclusive.
export function countShowtimesInRange(
  film: FilmWithCinemasLite,
  start: string,
  end: string
): number {
  return film.cinemaShowtimes.reduce(
    (total, cs) =>
      total +
      cs.showtimes.filter((s) => s.date >= start && s.date <= end).length,
    0
  );
}

// The "This Week" set: up to 10 films with the most showtimes over the next 7
// days (today inclusive), ranked descending. Shared by TopFilmsBar (to render)
// and ComingSoonBar (to exclude), so both agree on what "This Week" contains.
export function topFilmsThisWeek(
  films: FilmWithCinemasLite[],
  today: string,
  limit = 10
): { film: FilmWithCinemasLite; count: number }[] {
  const weekEnd = addDays(today, 7);
  return films
    .map((film) => ({ film, count: countShowtimesInRange(film, today, weekEnd) }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

export function filterPastShowtimes(
  showtimes: Showtime[],
  today: string,
  currentTime: string
): Showtime[] {
  return showtimes.filter(
    (s) => s.date > today || (s.date === today && s.time >= currentTime)
  );
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function groupShowtimesByDate(
  showtimes: Showtime[]
): [string, Showtime[]][] {
  const grouped: Record<string, Showtime[]> = {};
  for (const s of showtimes) {
    (grouped[s.date] ??= []).push(s);
  }
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}

export function filterByDay(
  grouped: [string, Showtime[]][],
  dayFilter: string[],
  today: string
): [string, Showtime[]][] {
  if (dayFilter.length === 0) return grouped;
  const targetDates = dayFilter.map((d) => (d === 'today' ? today : d));
  return grouped.filter(([date]) => targetDates.includes(date));
}
