import {
  filterPastShowtimes,
  formatDate,
  groupShowtimesByDate,
  filterByDay,
  hasShowtimeOn,
  topFilmsThisWeek,
  isPreview,
  previewFilms,
} from '../utils/date';
import { Showtime, FilmWithCinemasLite } from '../types';

const makeFilm = (
  slug: string,
  dates: string[],
  releaseDate: string | null = null,
  releaseDateNl: string | null = null
): FilmWithCinemasLite => ({
  slug,
  title: slug,
  director: null,
  runtime: null,
  posterUrl: '',
  genres: [],
  releaseDate,
  releaseDateNl,
  cinemaShowtimes: [
    {
      cinema: 'Cinema',
      showtimes: dates.map((date) => ({ date, time: '18:00', url: '' })),
    },
  ],
});

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

describe('hasShowtimeOn', () => {
  it('returns true when a showtime falls on the date', () => {
    expect(hasShowtimeOn(makeFilm('f', ['2024-03-15']), '2024-03-15')).toBe(
      true
    );
  });

  it('returns false when no showtime falls on the date', () => {
    expect(hasShowtimeOn(makeFilm('f', ['2024-03-16']), '2024-03-15')).toBe(
      false
    );
  });

  it('returns false for a film with no showtimes', () => {
    expect(hasShowtimeOn(makeFilm('f', []), '2024-03-15')).toBe(false);
  });

  it('checks across all cinemas', () => {
    const film: FilmWithCinemasLite = {
      slug: 'film',
      title: 'Film',
      director: null,
      runtime: null,
      posterUrl: '',
      genres: [],
      cinemaShowtimes: [
        { cinema: 'A', showtimes: [{ date: '2024-03-16', time: '18:00', url: '' }] },
        { cinema: 'B', showtimes: [{ date: '2024-03-15', time: '20:00', url: '' }] },
      ],
    };
    expect(hasShowtimeOn(film, '2024-03-15')).toBe(true);
  });
});

describe('isPreview', () => {
  const today = '2024-03-15';

  it('is true when a showtime falls before a future NL release', () => {
    const film = makeFilm('f', ['2024-03-16'], null, '2024-03-20');
    expect(isPreview(film, today)).toBe(true);
  });

  it('is false when all showtimes are on or after the NL release', () => {
    // The Odyssey case: first showtime is on release day, none before it.
    const film = makeFilm('f', ['2024-03-20', '2024-03-21'], null, '2024-03-20');
    expect(isPreview(film, today)).toBe(false);
  });

  it('is false when the NL release date is not in the future', () => {
    const film = makeFilm('f', ['2024-03-16'], null, '2024-03-10');
    expect(isPreview(film, today)).toBe(false);
  });

  it('is false when there is no NL release date', () => {
    const film = makeFilm('f', ['2024-03-16']);
    expect(isPreview(film, today)).toBe(false);
  });

  it('ignores past showtimes before the NL release', () => {
    const film = makeFilm('f', ['2024-03-10'], null, '2024-03-20');
    expect(isPreview(film, today)).toBe(false);
  });
});

describe('previewFilms', () => {
  const today = '2024-03-15';

  it('returns preview films sorted by earliest showtime', () => {
    const later = makeFilm('later', ['2024-03-18'], null, '2024-03-25');
    const sooner = makeFilm('sooner', ['2024-03-16'], null, '2024-03-22');
    const notPreview = makeFilm('released', ['2024-03-16'], null, '2024-03-01');
    const result = previewFilms([later, sooner, notPreview], today);
    expect(result.map((f) => f.slug)).toEqual(['sooner', 'later']);
  });
});

describe('topFilmsThisWeek', () => {
  const today = '2024-03-15';

  it('ranks films by showtime count in the next 7 days', () => {
    const busy = makeFilm('busy', ['2024-03-15', '2024-03-16', '2024-03-17']);
    const quiet = makeFilm('quiet', ['2024-03-16']);
    const result = topFilmsThisWeek([quiet, busy], today);
    expect(result.map((r) => r.film.slug)).toEqual(['busy', 'quiet']);
    expect(result[0].count).toBe(3);
  });

  it('excludes films with no showtimes in the window', () => {
    const past = makeFilm('past', ['2024-03-01']);
    const future = makeFilm('future', ['2024-04-01']);
    const inWindow = makeFilm('in-window', ['2024-03-16']);
    const result = topFilmsThisWeek([past, future, inWindow], today);
    expect(result.map((r) => r.film.slug)).toEqual(['in-window']);
  });

  it('excludes future-release films that are not showing today', () => {
    // A not-yet-released film with heavy opening-weekend showings but nothing
    // today should fall through to Previews/Coming Soon rather than This Week.
    const upcoming = makeFilm(
      'upcoming',
      ['2024-03-16', '2024-03-17', '2024-03-18'],
      '2024-03-16'
    );
    const released = makeFilm('released', ['2024-03-16'], '2024-01-01');
    const result = topFilmsThisWeek([upcoming, released], today);
    expect(result.map((r) => r.film.slug)).toEqual(['released']);
  });

  it('keeps future-release films that are showing today', () => {
    // A preview run that has started (screening today) belongs in This Week too.
    const previewToday = makeFilm(
      'preview',
      ['2024-03-15', '2024-03-16'],
      '2024-03-20'
    );
    const result = topFilmsThisWeek([previewToday], today);
    expect(result.map((r) => r.film.slug)).toEqual(['preview']);
  });

  it('keeps films whose release date is today or past', () => {
    const releasedToday = makeFilm('today', ['2024-03-16'], today);
    const result = topFilmsThisWeek([releasedToday], today);
    expect(result.map((r) => r.film.slug)).toEqual(['today']);
  });

  it('respects the limit', () => {
    const films = Array.from({ length: 5 }, (_, i) =>
      makeFilm(`f${i}`, ['2024-03-16'])
    );
    expect(topFilmsThisWeek(films, today, 3)).toHaveLength(3);
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
