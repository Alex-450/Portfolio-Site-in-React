import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cinemas, getCinemaSlug } from '../data/cinemas';

// A compact, name-only row of links to the per-cinema pages. Deliberately
// minimal: the previous version used address cards, which added too much
// vertical space above the listings on mobile.
const CinemaBar = () => {
  return (
    <nav className="cinema-bar" aria-label="Browse by cinema">
      <span className="cinema-bar-label">Browse by cinema</span>
      <div className="cinema-bar-track">
        {Object.entries(cinemas).map(([key, cinema]) => (
          <Link
            key={key}
            href={`/cinemas/${getCinemaSlug(key)}/`}
            className="cinema-bar-item"
          >
            {cinema.name}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default CinemaBar;
