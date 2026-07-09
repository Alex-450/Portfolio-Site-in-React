import { FilmWithCinemasLite } from '../types';
import { firstShowtimeDate, formatDate, topFilmsThisWeek } from '../utils/date';
import FilmBar from './FilmBar';

interface ComingSoonBarProps {
  films: FilmWithCinemasLite[];
  today: string;
  showLabel?: boolean;
  emptyMessage?: string;
}

const ComingSoonBar = ({
  films,
  today,
  showLabel = true,
  emptyMessage,
}: ComingSoonBarProps) => {
  // Films releasing in the future that aren't already surfaced in "This Week"
  // (the top films screening over the next 7 days). A future release date means
  // the film isn't showing today, so this covers both exclusions.
  const thisWeekSlugs = new Set(
    topFilmsThisWeek(films, today).map(({ film }) => film.slug)
  );

  const comingSoon = films
    .filter(
      (film) =>
        !!film.releaseDate &&
        film.releaseDate > today &&
        !thisWeekSlugs.has(film.slug) &&
        // Require a wide-ish release: films showing in fewer than 3 cinemas are
        // usually very limited runs that won't interest most people.
        film.cinemaShowtimes.length >= 3
    )
    .sort((a, b) =>
      (firstShowtimeDate(a) ?? '').localeCompare(firstShowtimeDate(b) ?? '')
    )
    .slice(0, 10);

  return (
    <FilmBar
      label={showLabel ? 'Coming Soon' : undefined}
      explainer="Upcoming releases this month"
      emptyMessage={emptyMessage}
      films={comingSoon}
      renderBadge={(film) => {
        const firstDate = firstShowtimeDate(film);
        return firstDate ? (
          <div className="upcoming-release-date">{formatDate(firstDate)}</div>
        ) : null;
      }}
    />
  );
};

export default ComingSoonBar;
