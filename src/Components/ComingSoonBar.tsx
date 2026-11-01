import { FilmWithCinemas } from '../types';
import { comingSoonFilms, firstShowtimeDate, formatDate } from '../utils/date';
import FilmBar from './FilmBar';

interface ComingSoonBarProps {
  films: FilmWithCinemas[];
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
  const comingSoon = comingSoonFilms(films, today);

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
