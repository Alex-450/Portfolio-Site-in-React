import { filterFilms, filterFilmsBySearch } from '../utils/filmFilters';
import { FilmWithCinemasLite } from '../types';

const createFilm = (overrides: Partial<FilmWithCinemasLite> = {}): FilmWithCinemasLite => ({
  slug: 'test-film',
  title: 'Test Film',
  genres: ['Drama'],
  director: 'Test Director',
  releaseDate: '2024-01-01',
  dateAdded: '2024-03-01',
  cinemaShowtimes: [
    {
      cinema: 'Cinema A',
      showtimes: [
        { date: '2024-03-15', time: '14:00', url: 'http://example.com/1' },
        { date: '2024-03-15', time: '18:00', url: 'http://example.com/2' },
      ],
    },
  ],
  ...overrides,
});

describe('filterFilmsBySearch', () => {
  const films = [
    createFilm({ title: 'The Godfather', slug: 'the-godfather' }),
    createFilm({ title: 'Pulp Fiction', slug: 'pulp-fiction' }),
    createFilm({ title: 'The Dark Knight', slug: 'the-dark-knight' }),
  ];

  it('returns all films when search is empty', () => {
    expect(filterFilmsBySearch(films, '')).toHaveLength(3);
  });

  it('filters by title (case insensitive)', () => {
    expect(filterFilmsBySearch(films, 'godfather')).toHaveLength(1);
    expect(filterFilmsBySearch(films, 'GODFATHER')).toHaveLength(1);
    expect(filterFilmsBySearch(films, 'The')).toHaveLength(2);
  });

  it('returns empty array when no match', () => {
    expect(filterFilmsBySearch(films, 'xyz')).toHaveLength(0);
  });
});

describe('filterFilms', () => {
  const baseOptions = {
    cinemaFilter: [],
    dayFilter: [],
    filmFilter: '',
    genreFilter: [],
    directorFilter: '',
    today: '2024-03-14',
    currentTime: '10:00',
  };

  it('returns all films with no filters', () => {
    const films = [createFilm(), createFilm({ slug: 'film-2', title: 'Film 2' })];
    const result = filterFilms(films, baseOptions);
    expect(result).toHaveLength(2);
  });

  it('filters by cinema', () => {
    const films = [
      createFilm(),
      createFilm({
        slug: 'film-2',
        cinemaShowtimes: [
          { cinema: 'Cinema B', showtimes: [{ date: '2024-03-15', time: '14:00', url: 'http://b.com' }] },
        ],
      }),
    ];
    const result = filterFilms(films, { ...baseOptions, cinemaFilter: ['Cinema A'] });
    expect(result).toHaveLength(1);
  });

  it('filters by genre', () => {
    const films = [
      createFilm({ genres: ['Drama', 'Action'] }),
      createFilm({ slug: 'film-2', genres: ['Comedy'] }),
    ];
    const result = filterFilms(films, { ...baseOptions, genreFilter: ['Action'] });
    expect(result).toHaveLength(1);
  });

  it('filters by director (case insensitive)', () => {
    const films = [
      createFilm({ director: 'Christopher Nolan' }),
      createFilm({ slug: 'film-2', director: 'Quentin Tarantino' }),
    ];
    const result = filterFilms(films, { ...baseOptions, directorFilter: 'christopher nolan' });
    expect(result).toHaveLength(1);
  });

  it('filters by film name', () => {
    const films = [
      createFilm({ title: 'Inception' }),
      createFilm({ slug: 'film-2', title: 'Interstellar' }),
    ];
    const result = filterFilms(films, { ...baseOptions, filmFilter: 'ception' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Inception');
  });

  it('filters by day', () => {
    const films = [
      createFilm({
        cinemaShowtimes: [
          { cinema: 'Cinema A', showtimes: [{ date: '2024-03-15', time: '14:00', url: 'http://a.com' }] },
        ],
      }),
      createFilm({
        slug: 'film-2',
        cinemaShowtimes: [
          { cinema: 'Cinema A', showtimes: [{ date: '2024-03-16', time: '14:00', url: 'http://b.com' }] },
        ],
      }),
    ];
    const result = filterFilms(films, { ...baseOptions, dayFilter: ['2024-03-15'] });
    expect(result).toHaveLength(1);
  });

  it('filters out films with no remaining showtimes after filtering', () => {
    const films = [
      createFilm({
        cinemaShowtimes: [
          { cinema: 'Cinema A', showtimes: [{ date: '2024-03-15', time: '14:00', url: 'http://a.com' }] },
        ],
      }),
    ];
    const result = filterFilms(films, { ...baseOptions, cinemaFilter: ['Cinema Z'] });
    expect(result).toHaveLength(0);
  });

  it('filters recently added films', () => {
    const films = [
      createFilm({ dateAdded: '2024-03-10' }), // 4 days ago
      createFilm({ slug: 'film-2', dateAdded: '2024-03-01' }), // 13 days ago
    ];
    const result = filterFilms(films, { ...baseOptions, today: '2024-03-14', recentlyAdded: true });
    expect(result).toHaveLength(1);
  });

  it('filters upcoming releases', () => {
    const films = [
      createFilm({ releaseDate: '2024-03-20' }), // Future
      createFilm({ slug: 'film-2', releaseDate: '2024-03-01' }), // Past
    ];
    const result = filterFilms(films, { ...baseOptions, today: '2024-03-14', upcomingRelease: true });
    expect(result).toHaveLength(1);
    expect(result[0].releaseDate).toBe('2024-03-20');
  });
});
