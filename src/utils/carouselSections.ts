import { FilmWithCinemasLite } from '../types';
import {
  isRecentlyAdded,
  isRecentlyReleased,
  isReRelease,
} from './filmFilters';

export interface CarouselSection {
  label: string;
  films: FilmWithCinemasLite[];
}

// The featured rows that sit above the genre rows, in display order. Each film
// lands in at most one — the first list whose test it passes — so it never
// appears twice among the featured rows. Films here still flow through to the
// genre rows below: a row is a shortcut to a film, not its only home.
const FEATURED_SECTIONS: {
  label: string;
  test: (film: FilmWithCinemasLite, today: string) => boolean;
}[] = [
  {
    label: 'Recently Added',
    test: (film, today) => isRecentlyAdded(film.dateAdded, today),
  },
  {
    label: 'New Releases',
    test: (film, today) => isRecentlyReleased(film.releaseDate, today),
  },
  {
    label: 'Re-releases',
    test: (film, today) => isReRelease(film.releaseDate, today),
  },
];

// Build the featured rows, dropping any that ended up empty.
export function featuredSections(
  films: FilmWithCinemasLite[],
  today: string
): CarouselSection[] {
  const sections: CarouselSection[] = FEATURED_SECTIONS.map(({ label }) => ({
    label,
    films: [],
  }));

  for (const film of films) {
    const index = FEATURED_SECTIONS.findIndex(({ test }) => test(film, today));
    if (index !== -1) sections[index].films.push(film);
  }

  return sections.filter((section) => section.films.length > 0);
}
