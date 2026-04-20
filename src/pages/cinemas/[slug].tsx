import { readFileSync } from 'fs';
import { join } from 'path';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { FilmsIndex, FilmWithCinemasLite } from '../../types';
import { cinemas, getCinemaBySlug, Cinema } from '../../data/cinemas';
import PosterCarousel from '../../Components/PosterCarousel';
import CinemaShowtimesPage from '../../Components/CinemaShowtimesPage';
import { getToday } from '../../utils/date';

interface CinemaPageProps {
  cinemaKey: string;
  cinema: Cinema;
  films: FilmWithCinemasLite[];
  todayFilms: FilmWithCinemasLite[];
}

export default function CinemaPage({
  cinemaKey,
  cinema,
  films,
  todayFilms,
}: CinemaPageProps) {
  return (
    <>
      <Head>
        <title>{`${cinema.name} | Film Listings | a-450`}</title>
        <meta
          name="description"
          content={`Showtimes at ${cinema.name}, ${cinema.address}`}
        />
      </Head>
      <Container className="cinema-detail-container">
        <div className="cinema-detail-header">
          <h1>{cinema.name}</h1>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cinema-detail-address"
          >
            {cinema.address}
            <ArrowUpRight size={14} />
          </a>
          <a
            href={cinema.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cinema-detail-website"
          >
            {cinema.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
            <ArrowUpRight size={14} />
          </a>
        </div>

        {todayFilms.length > 0 && (
          <div className="cinema-poster-section">
            <h2>Showing today at {cinema.name}</h2>
            <PosterCarousel films={todayFilms} linkToDetail />
          </div>
        )}

        <div className="film-detail-showtimes">
          <h2>Showtimes</h2>
          <CinemaShowtimesPage films={films} cinemaKey={cinemaKey} />
        </div>

        <Link href="/film-listings/" className="back-link">
          <ArrowLeft size={16} /> Back to Film Listings
        </Link>
      </Container>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = Object.values(cinemas).map((cinema) => ({
    params: { slug: cinema.slug },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<CinemaPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const result = getCinemaBySlug(slug);

  if (!result) {
    return { notFound: true };
  }

  const { key: cinemaKey, cinema } = result;

  const filePath = join(process.cwd(), 'src/data/films.json');
  let allFilms: FilmsIndex = {};
  try {
    const data = readFileSync(filePath, 'utf-8');
    allFilms = JSON.parse(data);
  } catch {
    // films.json doesn't exist yet
  }

  const today = getToday();

  const films: FilmWithCinemasLite[] = [];
  const todayFilms: FilmWithCinemasLite[] = [];

  for (const [filmSlug, film] of Object.entries(allFilms)) {
    const matchingShowtimes = film.cinemaShowtimes.filter(
      (cs) => cs.cinema === cinemaKey
    );
    if (matchingShowtimes.length === 0) continue;

    const lite: FilmWithCinemasLite = {
      slug: filmSlug,
      title: film.title,
      director: film.director,
      runtime: film.runtime,
      posterUrl: film.posterUrl,
      genres: film.tmdb?.genres ?? [],
      cinemaShowtimes: matchingShowtimes,
      dateAdded: film.dateAdded,
      releaseDate: film.tmdb?.releaseDate ?? null,
      releaseYear: film.tmdb?.releaseDate?.split('-')[0] ?? null,
      overview: film.tmdb?.overview ?? null,
    };

    films.push(lite);

    const hasToday = matchingShowtimes.some((cs) =>
      cs.showtimes.some((s) => s.date === today)
    );
    if (hasToday) {
      todayFilms.push(lite);
    }
  }

  return {
    props: {
      cinemaKey,
      cinema,
      films,
      todayFilms,
    },
  };
};
