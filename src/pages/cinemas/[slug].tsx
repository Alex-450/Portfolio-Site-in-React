import { readFileSync } from 'fs';
import { join } from 'path';
import { useMemo, useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { FilmsIndex, FilmWithCinemasLite } from '../../types';
import { cinemas, getCinemaBySlug, Cinema } from '../../data/cinemas';
import PosterCarousel from '../../Components/PosterCarousel';
import CinemaShowtimesPage from '../../Components/CinemaShowtimesPage';
import { formatDate, getToday, getCurrentTime } from '../../utils/date';

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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const today = useMemo(getToday, []);
  const currentTime = useMemo(getCurrentTime, []);

  // Until the day tabs below resolve their active date, fall back to the films
  // baked in at build time so the posters aren't empty on first paint.
  const dayFilms = useMemo(() => {
    if (!selectedDay) return todayFilms;
    // Mirror the day tabs, which drop showings that have already started, so a
    // film whose last screening today is over doesn't linger in the posters.
    return films.filter((film) =>
      film.cinemaShowtimes.some((cs) =>
        cs.showtimes.some(
          (s) =>
            s.date === selectedDay && (s.date > today || s.time >= currentTime)
        )
      )
    );
  }, [films, todayFilms, selectedDay, today, currentTime]);

  const posterHeading =
    selectedDay && selectedDay !== today
      ? `Showing ${formatDate(selectedDay)} at ${cinema.name}`
      : `Showing today at ${cinema.name}`;

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

        {dayFilms.length > 0 && (
          <div className="cinema-poster-section">
            <h2>{posterHeading}</h2>
            <PosterCarousel films={dayFilms} linkToDetail today={today} />
          </div>
        )}

        <div className="film-detail-showtimes">
          <h2>Showtimes</h2>
          <CinemaShowtimesPage
            films={films}
            cinemaKey={cinemaKey}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
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
  const data = readFileSync(filePath, 'utf-8');
  const allFilms: FilmsIndex = JSON.parse(data);

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
      releaseDateNl: film.tmdb?.releaseDateNl ?? null,
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
