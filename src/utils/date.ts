import { Showtime } from '../types';

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function groupShowtimesByDate(showtimes: Showtime[]): [string, Showtime[]][] {
  const grouped: Record<string, Showtime[]> = {};
  for (const s of showtimes) {
    (grouped[s.date] ??= []).push(s);
  }
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}

export function filterByDay(
  grouped: [string, Showtime[]][],
  dayFilter: string,
  today: string
): [string, Showtime[]][] {
  if (!dayFilter) return grouped;
  if (dayFilter === 'today') return grouped.filter(([date]) => date === today);
  return grouped.filter(([date]) => date === dayFilter);
}
