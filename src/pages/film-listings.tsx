import { readFileSync } from 'fs';
import { join } from 'path';
import FilmListings from '../Components/FilmListings';
import { FilmsIndex } from '../types';

interface Props {
  filmsIndex: FilmsIndex;
}

export default function Page({ filmsIndex }: Props) {
  return <FilmListings filmsIndex={filmsIndex} />;
}

export function getStaticProps() {
  const filmsPath = join(process.cwd(), 'src/data/films.json');

  let filmsIndex: FilmsIndex = {};
  try {
    const filmsData = readFileSync(filmsPath, 'utf-8');
    filmsIndex = JSON.parse(filmsData);
  } catch {
    // films.json may not exist yet
  }

  return {
    props: {
      filmsIndex,
    },
  };
}
