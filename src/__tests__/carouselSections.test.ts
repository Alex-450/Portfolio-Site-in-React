import { featuredSections } from '../utils/carouselSections';
import { FilmWithCinemasLite } from '../types';

const TODAY = '2024-03-15';

const createFilm = (
  overrides: Partial<FilmWithCinemasLite> = {}
): FilmWithCinemasLite => ({
  slug: 'test-film',
  title: 'Test Film',
  genres: ['Drama'],
  director: 'Test Director',
  runtime: null,
  posterUrl: '',
  releaseDate: null,
  dateAdded: null,
  cinemaShowtimes: [],
  ...overrides,
});

describe('featuredSections', () => {
  it('sorts films into the three featured rows', () => {
    const films = [
      createFilm({ slug: 'added', dateAdded: '2024-03-14' }),
      createFilm({ slug: 'new', releaseDate: '2024-02-20' }),
      createFilm({ slug: 'old', releaseDate: '1975-05-01' }),
    ];

    expect(
      featuredSections(films, TODAY).map(({ label, films: f }) => [
        label,
        f.map((x) => x.slug),
      ])
    ).toEqual([
      ['Recently Added', ['added']],
      ['New Releases', ['new']],
      ['Re-releases', ['old']],
    ]);
  });

  it('places a film that qualifies for several rows in only the first', () => {
    // A re-release added to the site yesterday matches both tests.
    const film = createFilm({
      slug: 'restored-classic',
      dateAdded: '2024-03-14',
      releaseDate: '1975-05-01',
    });

    const sections = featuredSections([film], TODAY);

    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('Recently Added');
  });

  it('omits rows that have no films', () => {
    expect(
      featuredSections([createFilm({ releaseDate: '2023-06-01' })], TODAY)
    ).toEqual([]);
  });

  it('preserves the incoming order within each row', () => {
    const films = [
      createFilm({ slug: 'b', dateAdded: '2024-03-13' }),
      createFilm({ slug: 'a', dateAdded: '2024-03-15' }),
    ];

    expect(featuredSections(films, TODAY)[0].films.map((f) => f.slug)).toEqual([
      'b',
      'a',
    ]);
  });
});
