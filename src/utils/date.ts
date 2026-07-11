import { Showtime, FilmWithCinemasLite } from '../types';

// Date `days` days after `from` (YYYY-MM-DD), as YYYY-MM-DD.
export function addDays(from: string, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Earliest showtime date for a film (YYYY-MM-DD), or null if it has none.
export function firstShowtimeDate(
  film: FilmWithCinemasLite
): string | null {
  let earliest: string | null = null;
  for (const cs of film.cinemaShowtimes) {
    for (const s of cs.showtimes) {
      if (earliest === null || s.date < earliest) earliest = s.date;
    }
  }
  return earliest;
}

// Whether a film has at least one showtime on the given date (YYYY-MM-DD).
export function hasShowtimeOn(
  film: FilmWithCinemasLite,
  date: string
): boolean {
  return film.cinemaShowtimes.some((cs) =>
    cs.showtimes.some((s) => s.date === date)
  );
}

// Number of a film's showtimes falling within [start, end] inclusive.
export function countShowtimesInRange(
  film: FilmWithCinemasLite,
  start: string,
  end: string
): number {
  return film.cinemaShowtimes.reduce(
    (total, cs) =>
      total +
      cs.showtimes.filter((s) => s.date >= start && s.date <= end).length,
    0
  );
}

// A "preview" is a film screening before its Dutch release date: it has at
// least one upcoming showtime that falls before releaseDateNl, and that release
// is still in the future. Such films belong in the Previews bar (and, if they
// also screen today, in This Week — see topFilmsThisWeek).
export function isPreview(film: FilmWithCinemasLite, today: string): boolean {
  const nlRelease = film.releaseDateNl;
  if (!nlRelease || nlRelease <= today) return false;
  return film.cinemaShowtimes.some((cs) =>
    cs.showtimes.some((s) => s.date >= today && s.date < nlRelease)
  );
}

// The Previews set: films screening ahead of their Dutch release, sorted by
// their earliest showtime. Shared by PreviewsBar (to render) and ComingSoonBar
// (to exclude) so a film never sits in both Previews and Coming Soon.
export function previewFilms(
  films: FilmWithCinemasLite[],
  today: string
): FilmWithCinemasLite[] {
  return films
    .filter((film) => isPreview(film, today))
    .sort((a, b) =>
      (firstShowtimeDate(a) ?? '').localeCompare(firstShowtimeDate(b) ?? '')
    );
}

// The "This Week" set: up to 10 films with the most showtimes over the next 7
// days (today inclusive), ranked descending. Shared by TopFilmsBar (to render)
// and comingSoonFilms (to exclude), so both agree on what "This Week" contains.
// A film whose release is still in the future is excluded so it falls through
// to Previews/Coming Soon instead — UNLESS it screens today (e.g. a preview
// run that has started), in which case it belongs in This Week too.
export function topFilmsThisWeek(
  films: FilmWithCinemasLite[],
  today: string,
  limit = 10
): { film: FilmWithCinemasLite; count: number }[] {
  const weekEnd = addDays(today, 7);
  return films
    .filter(
      (film) =>
        !(film.releaseDate && film.releaseDate > today) ||
        hasShowtimeOn(film, today)
    )
    .map((film) => ({ film, count: countShowtimesInRange(film, today, weekEnd) }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// The "Coming Soon" set: films releasing in the future that aren't already
// surfaced elsewhere — not screening today, not a preview, and not in This
// Week — with a wide-ish release (>= 3 cinemas), sorted by earliest showtime.
// Shared by ComingSoonBar (to render) and FilmListings (to decide whether to
// show the Coming Soon tab at all).
export function comingSoonFilms(
  films: FilmWithCinemasLite[],
  today: string
): FilmWithCinemasLite[] {
  const thisWeekSlugs = new Set(
    topFilmsThisWeek(films, today).map(({ film }) => film.slug)
  );
  return films
    .filter(
      (film) =>
        !!film.releaseDate &&
        film.releaseDate > today &&
        // A future release date doesn't guarantee the film isn't screening
        // today (e.g. preview showings), so exclude anything showing today.
        !hasShowtimeOn(film, today) &&
        // Films screening before their Dutch release live in the Previews bar.
        !isPreview(film, today) &&
        !thisWeekSlugs.has(film.slug) &&
        // Require a wide-ish release: films showing in fewer than 3 cinemas are
        // usually very limited runs that won't interest most people.
        film.cinemaShowtimes.length >= 3
    )
    .sort((a, b) =>
      (firstShowtimeDate(a) ?? '').localeCompare(firstShowtimeDate(b) ?? '')
    );
}

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
