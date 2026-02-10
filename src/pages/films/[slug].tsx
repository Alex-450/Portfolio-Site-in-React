import { readFileSync } from 'fs';
import { join } from 'path';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { FilmDetail, FilmsIndex } from '../../types';
import YouTubeEmbed from '../../Components/YouTubeEmbed';
import FilmShowtimes from '../../Components/FilmShowtimes';

interface Props {
  film: FilmDetail;
}

export default function FilmDetailPage({ film }: Props) {
  const year = film.tmdb?.releaseDate?.split('-')[0];

  return (
    <>
      <Head>
        <title>{film.title} | Film Listings | a-450</title>
        <meta
          name="description"
          content={film.tmdb?.overview || `Showtimes for ${film.title}`}
        />
      </Head>
      <Container className="film-detail-container">
        <div className="film-detail-header">
          {film.posterUrl ? (
            <img className="film-detail-poster" src={film.posterUrl} alt={film.title} />
          ) : (
            <div className="film-detail-poster-placeholder" />
          )}
          <div className="film-detail-info">
            <h1>{film.title}</h1>
            {film.director && (
              <p className="film-detail-director">Directed by {film.director}</p>
            )}

            {film.tmdb && (
              <div className="film-detail-meta">
                {year && <span className="film-detail-badge">{year}</span>}
                {(film.tmdb.runtime || film.length) && (
                  <span className="film-detail-badge">{film.tmdb.runtime || film.length} min</span>
                )}
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
          </div>
        </div>

        {film.tmdb?.youtubeTrailerId && (
          <div className="film-detail-trailer">
            <YouTubeEmbed videoId={film.tmdb.youtubeTrailerId} />
          </div>
        )}

        <div className="film-detail-showtimes">
          <h2>Showtimes</h2>
          <FilmShowtimes cinemaShowtimes={film.cinemaShowtimes} />
        </div>

        <Link href="/film-listings/" className="back-link">
          &larr; Back to Film Listings
        </Link>
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
