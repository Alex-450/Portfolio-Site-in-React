import Head from 'next/head';
import Link from 'next/link';
import { Container } from 'react-bootstrap';
import { ArrowUpRight } from 'lucide-react';
import { cinemas, Cinema } from '../../data/cinemas';

interface CinemaEntry {
  slug: string;
  cinema: Cinema;
}

interface Props {
  cinemaList: CinemaEntry[];
}

export default function CinemasIndex({ cinemaList }: Props) {
  return (
    <>
      <Head>
        <title>Cinemas | Film Listings | a-450</title>
        <meta
          name="description"
          content="Independent cinemas in Amsterdam and Haarlem"
        />
      </Head>
      <Container className="cinema-index-container">
        <h1>Cinemas</h1>
        <div className="cinema-index-grid">
          {cinemaList.map(({ slug, cinema }) => (
            <div key={slug} className="cinema-index-card">
              <Link href={`/cinemas/${slug}/`} className="cinema-index-name">
                {cinema.name}
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cinema-index-address"
              >
                {cinema.address}
                <ArrowUpRight size={14} />
              </a>
              <a
                href={cinema.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cinema-index-website"
              >
                {cinema.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}
                <ArrowUpRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

export function getStaticProps() {
  const cinemaList: CinemaEntry[] = Object.values(cinemas).map((cinema) => ({
    slug: cinema.slug,
    cinema,
  }));

  return { props: { cinemaList } };
}
