import { readFileSync } from 'fs';
import { join } from 'path';
import FilmListings from '../Components/FilmListings';
import { Cinema, FilmsIndex } from '../types';

interface Props {
  cinemas: Cinema[];
  filmsIndex: FilmsIndex;
}

export default function Page({ cinemas, filmsIndex }: Props) {
  return <FilmListings cinemas={cinemas} filmsIndex={filmsIndex} />;
}

export function getStaticProps() {
  const showtimesPath = join(process.cwd(), 'src/data/showtimes.json');
  const filmsPath = join(process.cwd(), 'src/data/films.json');

  const showtimesData = readFileSync(showtimesPath, 'utf-8');
  const cinemas: Cinema[] = JSON.parse(showtimesData);

  let filmsIndex: FilmsIndex = {};
  try {
    const filmsData = readFileSync(filmsPath, 'utf-8');
    filmsIndex = JSON.parse(filmsData);
  } catch {
    // films.json may not exist yet
  }

  return {
    props: {
      cinemas,
      filmsIndex,
    },
  };
}
