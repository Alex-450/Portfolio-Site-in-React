import { Showtime } from '../types';

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
