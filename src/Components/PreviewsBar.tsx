import { FilmWithCinemasLite } from '../types';
import { firstShowtimeDate, formatDate, previewFilms } from '../utils/date';
import FilmBar from './FilmBar';

interface PreviewsBarProps {
  films: FilmWithCinemasLite[];
  today: string;
  showLabel?: boolean;
  emptyMessage?: string;
}

const PreviewsBar = ({
  films,
  today,
  showLabel = true,
  emptyMessage,
}: PreviewsBarProps) => {
  // Films with showtimes ahead of their Dutch release date (preview screenings),
  // sorted by earliest showtime.
  const previews = previewFilms(films, today);

  return (
    <FilmBar
      label={showLabel ? 'Previews' : undefined}
      explainer="Preview screenings ahead of their release"
      emptyMessage={emptyMessage}
      films={previews}
      renderBadge={(film) => {
        const firstDate = firstShowtimeDate(film);
        return firstDate ? (
          <div className="upcoming-release-date">{formatDate(firstDate)}</div>
        ) : null;
      }}
    />
  );
};

export default PreviewsBar;
