import { readFileSync } from 'fs';
import { join } from 'path';

// dedupeByTmdbId lives in the build script (an .mjs with top-level side effects
// that require API keys), so the helpers are extracted and evaluated in
// isolation rather than importing the module.
function loadDedupe() {
  const src = readFileSync(
    join(process.cwd(), 'scripts/fetch-showtimes.mjs'),
    'utf-8'
  );
  const start = src.indexOf('function dedupeByTmdbId');
  const end = src.indexOf('async function generateFilmsJson');
  if (start === -1 || end === -1) {
    throw new Error('dedupeByTmdbId helpers not found in fetch-showtimes.mjs');
  }
  // eslint-disable-next-line no-new-func
  return new Function(`${src.slice(start, end)}\nreturn dedupeByTmdbId;`)() as (
    films: Film[],
    existing: Record<string, unknown>
  ) => Film[];
}

interface Film {
  slug: string;
  title: string;
  tmdb: { id: number } | null;
  director: string | null;
  runtime: number | null;
  posterUrl: string;
  cinemaShowtimes: {
    cinema: string;
    showtimes: { date: string; time: string; ticketUrl: string }[];
  }[];
}

const film = (
  slug: string,
  title: string,
  id: number | null,
  times: string[],
  cinema = 'Cinema A'
): Film => ({
  slug,
  title,
  tmdb: id ? { id } : null,
  director: null,
  runtime: null,
  posterUrl: '',
  cinemaShowtimes: [
    {
      cinema,
      showtimes: times.map((time) => ({
        date: '2026-01-01',
        time,
        ticketUrl: `ticket-${time}`,
      })),
    },
  ],
});

const showtimeCount = (films: Film[]) =>
  films.reduce(
    (n, f) => n + f.cinemaShowtimes.reduce((m, c) => m + c.showtimes.length, 0),
    0
  );

describe('dedupeByTmdbId', () => {
  let dedupe: ReturnType<typeof loadDedupe>;
  let log: jest.SpyInstance;

  beforeAll(() => {
    dedupe = loadDedupe();
  });
  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it('merges films sharing a TMDB id and keeps every showtime', () => {
    const result = dedupe(
      [
        film('coward', 'Coward', 1437981, ['10:00', '12:00']),
        film(
          'coward-first-pick',
          'Coward - First Pick',
          1437981,
          ['14:00'],
          'Cinema B'
        ),
      ],
      {}
    );

    expect(result).toHaveLength(1);
    expect(showtimeCount(result)).toBe(3);
    // Both cinemas survive the merge.
    expect(result[0].cinemaShowtimes.map((c) => c.cinema)).toEqual([
      'Cinema A',
      'Cinema B',
    ]);
  });

  it('collapses more than two duplicates of the same film', () => {
    const result = dedupe(
      [
        film('a', 'Het Vergeten Eiland (NL)', 1465063, ['1']),
        film('b', 'Forgotten Island', 1465063, ['2']),
        film('c', 'The Forgotten Island', 1465063, ['3']),
        film('d', 'The Forgotten Island x KALBO', 1465063, ['4']),
      ],
      {}
    );

    expect(result).toHaveLength(1);
    expect(showtimeCount(result)).toBe(4);
    expect(result[0].title).toBe('Forgotten Island');
  });

  it('never merges films without a TMDB id', () => {
    // Two unrelated workshops with no TMDB entry must stay separate: without an
    // id there's no evidence they're the same thing.
    const result = dedupe(
      [
        film('workshop-a', 'Workshop Beeldtoveren', null, ['1']),
        film('workshop-b', 'Workshop Stop Motion', null, ['2']),
      ],
      {}
    );

    expect(result).toHaveLength(2);
    expect(showtimeCount(result)).toBe(2);
  });

  it('keeps the plainest title but an already-published slug', () => {
    // The programme-labelled entry owns the live URL; the plain title is the
    // one readers should see. Title and slug are chosen independently.
    const result = dedupe(
      [
        film('tampopo', 'Tampopo', 11830, ['1']),
        film(
          'film-food-tampopo-incl-ramen',
          'Film & Food: Tampopo (incl. ramen)',
          11830,
          ['2']
        ),
      ],
      { 'film-food-tampopo-incl-ramen': { dateAdded: '2026-01-01' } }
    );

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Tampopo');
    expect(result[0].slug).toBe('film-food-tampopo-incl-ramen');
  });

  it('follows the plainest title when neither slug is published', () => {
    const result = dedupe(
      [
        film('a-long-programme-title', 'A Long Programme Title', 7, ['1']),
        film('short', 'Short', 7, ['2']),
      ],
      {}
    );

    expect(result[0].title).toBe('Short');
    expect(result[0].slug).toBe('short');
  });

  it('leaves distinct films untouched', () => {
    const result = dedupe(
      [
        film('a', 'Film A', 1, ['1']),
        film('b', 'Film B', 2, ['2']),
        film('c', 'Film C', 3, ['3']),
      ],
      {}
    );

    expect(result).toHaveLength(3);
    expect(showtimeCount(result)).toBe(3);
  });
});
