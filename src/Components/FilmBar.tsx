import { ReactNode } from 'react';
import Link from 'next/link';
import { FilmWithCinemasLite } from '../types';

interface FilmBarProps {
  // Optional heading. Omit when an external control (e.g. a tab toggle) labels the bar.
  label?: string;
  explainer: string;
  films: FilmWithCinemasLite[];
  // Standout line above the title that differs between bars (e.g. rank or release date).
  renderBadge?: (film: FilmWithCinemasLite, index: number) => ReactNode;
  // Extra item appended to the meta row (e.g. showings count).
  renderMeta?: (film: FilmWithCinemasLite, index: number) => ReactNode;
  // Shown when there are no films. If omitted, the bar renders nothing when empty.
  emptyMessage?: string;
}

const FilmBar = ({
  label,
  explainer,
  films,
  renderBadge,
  renderMeta,
  emptyMessage,
}: FilmBarProps) => {
  if (films.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="top-films-bar">
        {label && <div className="top-films-label">{label}</div>}
        <div className="top-films-explainer">{explainer}</div>
        <p className="no-results">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="top-films-bar">
      {label && <div className="top-films-label">{label}</div>}
      <div className="top-films-explainer">{explainer}</div>
      <div className="top-films-track">
        {films.map((film, i) => (
          <Link
            key={film.slug}
            href={`/films/${film.slug}/`}
            className="listing-card top-film-item"
          >
            {film.posterUrl && (
              <img
                src={film.posterUrl}
                alt={film.title}
                className="top-film-poster"
              />
            )}
            <div className="top-film-info">
              {renderBadge?.(film, i)}
              <div className="top-film-title">{film.title}</div>
              {film.director && (
                <div className="top-film-director">{film.director}</div>
              )}
              <div className="top-film-meta">
                {film.releaseYear && (
                  <span className="top-film-year">({film.releaseYear})</span>
                )}
                {film.runtime && <span>{film.runtime} min</span>}
                {renderMeta?.(film, i)}
              </div>
              {film.overview && (
                <div className="top-film-overview">{film.overview}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FilmBar;
