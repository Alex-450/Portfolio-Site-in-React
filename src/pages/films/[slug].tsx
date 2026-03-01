import { readFileSync } from 'fs';
import { join } from 'path';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import { FilmDetail, FilmsIndex } from '../../types';
import YouTubeEmbed from '../../Components/YouTubeEmbed';
import FilmShowtimes from '../../Components/FilmShowtimes';
import WatchlistButton from '../../Components/WatchlistButton';
import { useWatchlist } from '../../hooks/useWatchlist';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  film: FilmDetail;
}

function getLanguageName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export default function FilmDetailPage({ film }: Props) {
  const year = film.tmdb?.releaseDate?.split('-')[0];
  const language = film.tmdb?.originalLanguage
    ? getLanguageName(film.tmdb.originalLanguage)
    : null;
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const hasTrailer = !!film.tmdb?.youtubeTrailerId;

  return (
    <>
      <Head>
        <title>{`${film.title} | Film Listings | a-450`}</title>
        <meta
          name="description"
          content={film.tmdb?.overview || `Showtimes for ${film.title}`}
        />
      </Head>
      <Container className="film-detail-container">
        {hasTrailer ? (
          <div className="film-hero">
            <YouTubeEmbed videoId={film.tmdb!.youtubeTrailerId!} />
            <div className="film-hero-overlay">
              <div className="film-title-row">
                <h1 className="film-hero-title">{film.title}</h1>
                <WatchlistButton
                  isInWatchlist={isInWatchlist(film.slug)}
                  onToggle={() => toggleWatchlist(film.slug)}
                />
              </div>
              {film.director && (
                <p className="film-hero-director">
                  Directed by{' '}
                  <Link href={`/film-listings?director=${encodeURIComponent(film.director)}`}>
                    {film.director}
                  </Link>
                </p>
              )}
              <div className="film-hero-meta">
                {year && <span className="film-hero-badge">{year}</span>}
                {film.runtime && (
                  <span className="film-hero-badge">{film.runtime} minutes</span>
                )}
                {language && <span className="film-hero-badge">{language}</span>}
              </div>
              {film.tmdb?.genres && film.tmdb.genres.length > 0 && (
                <div className="film-hero-genres">
                  {film.tmdb.genres.map((genre) => (
                    <span key={genre} className="film-hero-genre">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {film.tmdb?.overview && (
                <p className="film-hero-overview">{film.tmdb.overview}</p>
              )}
              <div className="film-external-links">
                {film.tmdb?.imdbId && (
                  <a href={`https://www.imdb.com/title/${film.tmdb.imdbId}/`} target="_blank" rel="noopener noreferrer" className="film-external-link">IMDb<ArrowUpRight size={14} /></a>
                )}
                {film.tmdb?.rtId && (
                  <a href={`https://www.rottentomatoes.com/${film.tmdb.rtId}`} target="_blank" rel="noopener noreferrer" className="film-external-link">
                    Rotten Tomatoes{film.tmdb.rtScore ? ` ${film.tmdb.rtScore}` : ''}<ArrowUpRight size={14} />
                  </a>
                )}
                {film.tmdb?.metacriticId && (
                  <a href={`https://www.metacritic.com/${film.tmdb.metacriticId}`} target="_blank" rel="noopener noreferrer" className="film-external-link">
                    Metacritic{film.tmdb.metacriticScore ? ` ${film.tmdb.metacriticScore}` : ''}<ArrowUpRight size={14} />
                  </a>
                )}
                {film.tmdb?.letterboxdId && (
                  <a href={`https://letterboxd.com/film/${film.tmdb.letterboxdId}/`} target="_blank" rel="noopener noreferrer" className="film-external-link">
                    Letterboxd<ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="film-detail-header">
            {film.posterUrl ? (
              <img
                className="film-detail-poster"
                src={film.posterUrl}
                alt={film.title}
              />
            ) : (
              <div className="film-detail-poster-placeholder" />
            )}
            <div className="film-detail-info">
              <div className="film-title-row">
                <h1>{film.title}</h1>
                <WatchlistButton
                  isInWatchlist={isInWatchlist(film.slug)}
                  onToggle={() => toggleWatchlist(film.slug)}
                />
              </div>
              {film.director && (
                <p className="film-detail-director">
                  Directed by{' '}
                  <Link href={`/film-listings?director=${encodeURIComponent(film.director)}`}>
                    {film.director}
                  </Link>
                </p>
              )}
              {film.tmdb && (
                <div className="film-detail-meta">
                  {year && <span className="film-detail-badge">{year}</span>}
                  {film.runtime && (
                    <span className="film-detail-badge">{film.runtime} minutes</span>
                  )}
                  {language && <span className="film-detail-badge">{language}</span>}
                </div>
              )}
              {film.tmdb?.genres && film.tmdb.genres.length > 0 && (
                <div className="film-detail-genres">
                  {film.tmdb.genres.map((genre) => (
                    <span key={genre} className="film-detail-genre">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              {film.tmdb?.overview && (
                <div className="film-detail-overview">
                  <p>{film.tmdb.overview}</p>
                </div>
              )}
              <div className="film-external-links">
                {film.tmdb?.imdbId && (
                  <a href={`https://www.imdb.com/title/${film.tmdb.imdbId}/`} target="_blank" rel="noopener noreferrer" className="film-external-link">IMDb<ArrowUpRight size={14} /></a>
                )}
                {film.tmdb?.rtId && (
                  <a href={`https://www.rottentomatoes.com/${film.tmdb.rtId}`} target="_blank" rel="noopener noreferrer" className="film-external-link">
                    Rotten Tomatoes{film.tmdb.rtScore ? ` ${film.tmdb.rtScore}` : ''}<ArrowUpRight size={14} />
                  </a>
                )}
                {film.tmdb?.metacriticId && (
                  <a href={`https://www.metacritic.com/${film.tmdb.metacriticId}`} target="_blank" rel="noopener noreferrer" className="film-external-link">
                    Metacritic{film.tmdb.metacriticScore ? ` ${film.tmdb.metacriticScore}` : ''}<ArrowUpRight size={14} />
                  </a>
                )}
                {film.tmdb?.letterboxdId && (
                  <a href={`https://letterboxd.com/film/${film.tmdb.letterboxdId}/`} target="_blank" rel="noopener noreferrer" className="film-external-link">
                    Letterboxd<ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="film-detail-showtimes">
          <h2>Showtimes</h2>
          <FilmShowtimes
            cinemaShowtimes={film.cinemaShowtimes}
            filmTitle={film.title}
            filmLength={film.runtime}
          />
        </div>

        <Link href="/film-listings/" className="back-link">
          <ArrowLeft size={16} /> Back to Film Listings
        </Link>

        {film.tmdb && (
          <div className="film-detail-tmdb">
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="tmdb-link"
            >
              <img src="/tmdb-logo.svg" alt="TMDB" />
            </a>
          </div>
        )}
      </Container>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const filePath = join(process.cwd(), 'src/data/films.json');
  let films: FilmsIndex = {};

  try {
    const data = readFileSync(filePath, 'utf-8');
    films = JSON.parse(data);
  } catch {
    // films.json doesn't exist yet, return empty paths
  }

  const paths = Object.keys(films).map((slug) => ({
    params: { slug },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const filePath = join(process.cwd(), 'src/data/films.json');
  const data = readFileSync(filePath, 'utf-8');
  const films: FilmsIndex = JSON.parse(data);

  const slug = params?.slug as string;
  const film = films[slug];

  if (!film) {
    return { notFound: true };
  }

  return { props: { film } };
};
