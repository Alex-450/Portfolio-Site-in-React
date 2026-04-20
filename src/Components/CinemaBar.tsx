import Link from 'next/link';
import { cinemas, getCinemaSlug } from '../data/cinemas';

const CinemaBar = () => {
  const cinemaList = Object.entries(cinemas);

  return (
    <div className="top-films-bar">
      <div className="top-films-label">Cinemas</div>
      <div className="top-films-explainer">Browse showtimes by cinema</div>
      <div className="cinema-bar-track">
        {cinemaList.map(([key, cinema]) => (
          <Link
            key={key}
            href={`/cinemas/${getCinemaSlug(key)}/`}
            className="listing-card cinema-bar-item"
          >
            <div className="cinema-bar-name">{cinema.name}</div>
            <div className="cinema-bar-address">{cinema.address}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CinemaBar;
