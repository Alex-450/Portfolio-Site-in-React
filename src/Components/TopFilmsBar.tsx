import { FilmWithCinemasLite } from '../types';
import { topFilmsThisWeek } from '../utils/date';
import FilmBar from './FilmBar';

interface TopFilmsBarProps {
  films: FilmWithCinemasLite[];
  today: string;
  showLabel?: boolean;
  emptyMessage?: string;
}

const TopFilmsBar = ({
  films,
  today,
  showLabel = true,
  emptyMessage,
}: TopFilmsBarProps) => {
  const ranked = topFilmsThisWeek(films, today);

  const counts = new Map(ranked.map(({ film, count }) => [film.slug, count]));

  return (
    <FilmBar
      label={showLabel ? 'This Week' : undefined}
      explainer="Films with the most showings over the next 7 days"
      emptyMessage={emptyMessage}
      films={ranked.map(({ film }) => film)}
      renderBadge={(_, i) => <div className="top-film-rank">#{i + 1}</div>}
      renderMeta={(film) => (
        <span className="top-film-count">{counts.get(film.slug)} showings</span>
      )}
    />
  );
};

export default TopFilmsBar;
