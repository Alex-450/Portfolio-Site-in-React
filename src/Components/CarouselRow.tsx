import { FilmWithCinemasLite } from '../types';
import PosterCarousel from './PosterCarousel';

interface CarouselRowProps {
  label: string;
  films: FilmWithCinemasLite[];
}

const CarouselRow = ({ label, films }: CarouselRowProps) => {
  if (films.length === 0) return null;

  return (
    <div className="genre-carousel-row">
      <h2 className="genre-carousel-label">{label}</h2>
      <PosterCarousel films={films} linkToDetail />
    </div>
  );
};

export default CarouselRow;
