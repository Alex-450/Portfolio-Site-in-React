import Link from 'next/link';
import { FilmWithCinemasLite } from '../types';
import FilmShowtimes from './FilmShowtimes';

interface FilmCardProps {
  film: FilmWithCinemasLite;
  dayFilter: string[];
  today: string;
  isInWatchlist?: boolean;
  onToggleWatchlist?: () => void;
}

function FilmCard({
  film,
  dayFilter,
  today,
  isInWatchlist,
  onToggleWatchlist,
}: FilmCardProps) {
  const isNew = film.dateAdded
    ? Math.floor(
        (new Date(today).getTime() - new Date(film.dateAdded).getTime()) /
          (1000 * 60 * 60 * 24)
      ) <= 3
    : false;

  return (
    <div className="film-card">
      <Link href={`/films/${film.slug}/`} className="film-poster-link">
        {film.posterUrl ? (
          <img className="film-poster" src={film.posterUrl} alt={film.title} />
        ) : (
          <div className="film-poster-placeholder" />
        )}
        {isNew && <span className="film-new-badge">New</span>}
      </Link>
      <div className="film-info">
        <div className="film-title-row">
          <div className="film-title">
            <Link href={`/films/${film.slug}/`}>{film.title}</Link>
            {isNew && <span className="film-new-tag">New</span>}
          </div>
          {onToggleWatchlist && (
            <button
              className={`watchlist-icon${isInWatchlist ? ' watchlist-icon-active' : ''}`}
              onClick={onToggleWatchlist}
              aria-label={
                isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'
              }
            >
              {isInWatchlist ? '−' : '+'}
            </button>
          )}
        </div>
        {film.director && (
          <div className="film-director">
            <Link
              href={`/film-listings?director=${encodeURIComponent(film.director)}`}
            >
              {film.director}
            </Link>
          </div>
        )}
        <div className="film-meta">
          {film.runtime && (
            <span className="film-length">{film.runtime} minutes</span>
          )}
          {film.releaseYear && (
            <span className="film-year">({film.releaseYear})</span>
          )}
        </div>

        <FilmShowtimes
          cinemaShowtimes={film.cinemaShowtimes}
          filmTitle={film.title}
          filmLength={film.runtime}
          dayFilter={dayFilter}
          maxPerDay={5}
        />
      </div>
    </div>
  );
}

export default FilmCard;
