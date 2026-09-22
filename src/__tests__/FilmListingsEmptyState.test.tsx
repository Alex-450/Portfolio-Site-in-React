import { render, screen, fireEvent } from '@testing-library/react';
import FilmListings from '../Components/FilmListings';
import { FilmsIndexLite } from '../types';

const mockPush = jest.fn();
let mockQuery: Record<string, string> = {};

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    pathname: '/film-listings',
    push: mockPush,
    replace: jest.fn(),
  }),
}));

// Today, per the fake timers set below.
const TODAY = '2026-09-22';
const LATER = '2026-09-25';

// `today-film` keeps the default day on today; `later-film` is the only Drama
// and screens later, so filtering to Drama empties the list for the day alone.
const filmsIndex = {
  'today-film': {
    slug: 'today-film',
    title: 'Today Film',
    director: 'Another Director',
    genres: ['Comedy'],
    releaseDate: '2026-01-01',
    cinemaShowtimes: [
      {
        cinema: 'LAB111',
        showtimes: [{ date: TODAY, time: '20:00', url: 'https://example.com' }],
      },
    ],
  },
  'later-film': {
    slug: 'later-film',
    title: 'Later Film',
    director: 'Some Director',
    genres: ['Drama'],
    releaseDate: '2026-01-01',
    cinemaShowtimes: [
      {
        cinema: 'LAB111',
        showtimes: [{ date: LATER, time: '20:00', url: 'https://example.com' }],
      },
    ],
  },
} as unknown as FilmsIndexLite;

describe('FilmListings empty state', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockQuery = {};
    jest
      .useFakeTimers({ doNotFake: ['nextTick'] })
      .setSystemTime(new Date(`${TODAY}T10:00:00`));
  });

  afterEach(() => jest.useRealTimers());

  it('names the active day and offers to clear it when nothing matches', () => {
    // The only showtime is on a later date, so the default day empties the list.
    mockQuery = { genres: 'Drama', day: 'today' };
    render(<FilmListings filmsIndex={filmsIndex} />);

    expect(screen.getByText(/No showtimes found/)).toHaveTextContent(/ on /);
    expect(screen.getByRole('button', { name: 'Show all days' })).toBeTruthy();
  });

  it('clearing the day from the empty state widens to all days', () => {
    mockQuery = { genres: 'Drama', day: 'today' };
    render(<FilmListings filmsIndex={filmsIndex} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show all days' }));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ day: 'all', genres: 'Drama' }),
      }),
      undefined,
      { shallow: true }
    );
  });

  it('offers no day action when the day filter is already cleared', () => {
    mockQuery = { genres: 'Horror', day: 'all' };
    render(<FilmListings filmsIndex={filmsIndex} />);

    expect(screen.getByText(/No showtimes found/)).not.toHaveTextContent(
      / on /
    );
    expect(screen.queryByRole('button', { name: 'Show all days' })).toBeNull();
  });
});
