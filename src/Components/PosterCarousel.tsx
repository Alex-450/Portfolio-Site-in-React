import { FilmWithCinemasLite } from '../types';

interface PosterCarouselProps {
  films: FilmWithCinemasLite[];
  onPosterClick?: (filmTitle: string) => void;
}

const PosterCarousel = ({ films, onPosterClick }: PosterCarouselProps) => {
  const filmsWithPosters = films.filter((film) => film.posterUrl);

  if (filmsWithPosters.length === 0) return null;

  return (
    <div className="poster-carousel">
      <div className="poster-carousel-track">
        {filmsWithPosters.map((film) => (
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
        ))}
      </div>
    </div>
  );
};

export default PosterCarousel;
