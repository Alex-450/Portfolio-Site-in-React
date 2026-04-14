import Link from 'next/link';
import { FilmWithCinemasLite } from '../types';

interface TopFilmsBarProps {
  films: FilmWithCinemasLite[];
  today: string;
}

function countShowtimesThisWeek(film: FilmWithCinemasLite, today: string): number {
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  return film.cinemaShowtimes.reduce((total, cs) => {
    return (
      total +
      cs.showtimes.filter((s) => s.date >= today && s.date <= weekEndStr).length
    );
  }, 0);
}

const TopFilmsBar = ({ films, today }: TopFilmsBarProps) => {
  const topFilms = [...films]
    .map((film) => ({ film, count: countShowtimesThisWeek(film, today) }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ film, count }) => ({ film, count }));

  if (topFilms.length === 0) return null;

  return (
    <div className="top-films-bar">
      <div className="top-films-label">This Week</div>
      <div className="top-films-explainer">Films with the most showings over the next 7 days</div>
      <div className="top-films-track">
        {topFilms.map(({ film, count }, i) => (
          <Link
            key={film.slug}
            href={`/films/${film.slug}/`}
            className="top-film-item"
          >
            {film.posterUrl && (
              <img
                src={film.posterUrl}
                alt={film.title}
                className="top-film-poster"
              />
            )}
            <div className="top-film-info">
              <div className="top-film-rank">#{i + 1}</div>
              <div className="top-film-title">{film.title}</div>
              {film.director && (
                <div className="top-film-director">
                  {film.director}{film.releaseYear && <span className="top-film-year"> ({film.releaseYear})</span>}
                </div>
              )}
              {film.runtime && <div className="top-film-meta">{film.runtime} min</div>}
              <div className="top-film-meta"><span className="top-film-count">{count} showings</span></div>
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

export default TopFilmsBar;
