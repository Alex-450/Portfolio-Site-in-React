import Link from 'next/link';
import { FilmWithCinemasLite } from '../types';

interface PosterCarouselProps {
  films: FilmWithCinemasLite[];
  onPosterClick?: (filmTitle: string) => void;
  linkToDetail?: boolean;
}

const PosterCarousel = ({
  films,
  onPosterClick,
  linkToDetail,
}: PosterCarouselProps) => {
  const filmsWithPosters = films.filter((film) => film.posterUrl);

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
              <span className="poster-carousel-title">{film.title}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PosterCarousel;
