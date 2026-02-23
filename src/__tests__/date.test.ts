import {
  filterPastShowtimes,
  formatDate,
  groupShowtimesByDate,
  filterByDay,
} from '../utils/date';
import { Showtime } from '../types';

describe('filterPastShowtimes', () => {
  const showtimes: Showtime[] = [
    { date: '2024-03-15', time: '14:00', url: 'http://example.com/1' },
    { date: '2024-03-15', time: '18:00', url: 'http://example.com/2' },
    { date: '2024-03-16', time: '10:00', url: 'http://example.com/3' },
  ];

  it('keeps all showtimes for future dates', () => {
    const result = filterPastShowtimes(showtimes, '2024-03-14', '12:00');
    expect(result).toHaveLength(3);
  });

  it('filters out past showtimes for today', () => {
    const result = filterPastShowtimes(showtimes, '2024-03-15', '16:00');
    expect(result).toHaveLength(2);
    expect(result[0].time).toBe('18:00');
    expect(result[1].date).toBe('2024-03-16');
  });

  it('filters out all showtimes for past dates', () => {
    const result = filterPastShowtimes(showtimes, '2024-03-17', '00:00');
    expect(result).toHaveLength(0);
  });

  it('keeps showtime if current time equals showtime', () => {
    const result = filterPastShowtimes(showtimes, '2024-03-15', '14:00');
    expect(result).toHaveLength(3);
  });
});

describe('formatDate', () => {
  it('formats date string to readable format', () => {
    const result = formatDate('2024-03-15');
    expect(result).toMatch(/Fri/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/Mar/);
  });

  it('handles different dates correctly', () => {
    const result = formatDate('2024-01-01');
    expect(result).toMatch(/Mon/);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/Jan/);
  });
});

describe('groupShowtimesByDate', () => {
  it('groups showtimes by date', () => {
    const showtimes: Showtime[] = [
      { date: '2024-03-15', time: '14:00', url: 'http://example.com/1' },
      { date: '2024-03-15', time: '18:00', url: 'http://example.com/2' },
      { date: '2024-03-16', time: '10:00', url: 'http://example.com/3' },
    ];

    const result = groupShowtimesByDate(showtimes);
    expect(result).toHaveLength(2);
    expect(result[0][0]).toBe('2024-03-15');
    expect(result[0][1]).toHaveLength(2);
    expect(result[1][0]).toBe('2024-03-16');
    expect(result[1][1]).toHaveLength(1);
  });

  it('returns empty array for empty input', () => {
    const result = groupShowtimesByDate([]);
    expect(result).toHaveLength(0);
  });

  it('sorts dates in ascending order', () => {
    const showtimes: Showtime[] = [
      { date: '2024-03-20', time: '14:00', url: 'http://example.com/1' },
      { date: '2024-03-15', time: '14:00', url: 'http://example.com/2' },
      { date: '2024-03-18', time: '14:00', url: 'http://example.com/3' },
    ];

    const result = groupShowtimesByDate(showtimes);
    expect(result[0][0]).toBe('2024-03-15');
    expect(result[1][0]).toBe('2024-03-18');
    expect(result[2][0]).toBe('2024-03-20');
  });
});

describe('filterByDay', () => {
  const grouped: [string, Showtime[]][] = [
    ['2024-03-15', [{ date: '2024-03-15', time: '14:00', url: 'http://a.com' }]],
    ['2024-03-16', [{ date: '2024-03-16', time: '10:00', url: 'http://b.com' }]],
    ['2024-03-17', [{ date: '2024-03-17', time: '12:00', url: 'http://c.com' }]],
  ];

  it('returns all when dayFilter is empty', () => {
    const result = filterByDay(grouped, [], '2024-03-15');
    expect(result).toHaveLength(3);
  });

  it('filters to specific dates', () => {
    const result = filterByDay(grouped, ['2024-03-15', '2024-03-17'], '2024-03-15');
    expect(result).toHaveLength(2);
    expect(result[0][0]).toBe('2024-03-15');
    expect(result[1][0]).toBe('2024-03-17');
  });

  it('handles today filter', () => {
    const result = filterByDay(grouped, ['today'], '2024-03-16');
    expect(result).toHaveLength(1);
    expect(result[0][0]).toBe('2024-03-16');
  });
});
