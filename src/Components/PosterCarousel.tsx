import Link from 'next/link';
import { FilmWithCinemasLite } from '../types';

interface PosterCarouselProps {
  films: FilmWithCinemasLite[];
  onPosterClick?: (filmTitle: string) => void;
  linkToDetail?: boolean;
  today?: string;
}

const PosterCarousel = ({
  films,
  onPosterClick,
  linkToDetail,
  today,
}: PosterCarouselProps) => {
  const todayStr = today ?? new Date().toISOString().slice(0, 10);
  const filmsWithPosters = films.filter((film) => film.posterUrl);

  function isNew(dateAdded: string | null | undefined): boolean {
    if (!dateAdded) return false;
    return (
      Math.floor(
        (new Date(todayStr).getTime() - new Date(dateAdded).getTime()) /
          (1000 * 60 * 60 * 24)
      ) <= 3
    );
  }

  if (filmsWithPosters.length === 0) return null;

  return (
    <div className="poster-carousel">
      <div className="poster-carousel-track">
        {filmsWithPosters.map((film) =>
          linkToDetail ? (
            <Link
              key={film.slug}
              href={`/films/${film.slug}/`}
              className="poster-carousel-item poster-carousel-link"
              title={film.title}
            >
              <img
                src={film.posterUrl}
                alt={film.title}
                className="poster-carousel-image"
              />
              {isNew(film.dateAdded) && (
                <span className="film-new-badge">New</span>
              )}
              <span className="poster-carousel-title">{film.title}</span>
            </Link>
          ) : (
            <button
              key={film.title}
              className="poster-carousel-item"
              onClick={() => onPosterClick?.(film.title)}
              title={film.title}
            >
              <img
                src={film.posterUrl}
                alt={film.title}
                className="poster-carousel-image"
              />
              {isNew(film.dateAdded) && (
                <span className="film-new-badge">New</span>
              )}
              <span className="poster-carousel-title">{film.title}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PosterCarousel;
