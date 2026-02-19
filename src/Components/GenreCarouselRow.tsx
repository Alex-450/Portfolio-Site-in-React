import { FilmWithCinemasLite } from '../types';
import PosterCarousel from './PosterCarousel';

interface GenreCarouselRowProps {
  genre: string;
  films: FilmWithCinemasLite[];
}

const GenreCarouselRow = ({ genre, films }: GenreCarouselRowProps) => {
  if (films.length === 0) return null;

  return (
    <div className="genre-carousel-row">
      <h2 className="genre-carousel-label">{genre}</h2>
      <PosterCarousel films={films} linkToDetail />
    </div>
  );
};

export default GenreCarouselRow;
