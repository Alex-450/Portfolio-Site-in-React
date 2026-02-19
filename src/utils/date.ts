import { ShowtimeLite } from '../types';

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

export function groupShowtimesByDate(showtimes: ShowtimeLite[]): [string, ShowtimeLite[]][] {
  const grouped: Record<string, ShowtimeLite[]> = {};
  for (const s of showtimes) {
    (grouped[s.date] ??= []).push(s);
  }
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}

export function filterByDay(
  grouped: [string, ShowtimeLite[]][],
  dayFilter: string[],
  today: string
): [string, ShowtimeLite[]][] {
  if (dayFilter.length === 0) return grouped;
  const targetDates = dayFilter.map((d) => (d === 'today' ? today : d));
  return grouped.filter(([date]) => targetDates.includes(date));
}
