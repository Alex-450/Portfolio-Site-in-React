import { readFileSync } from 'fs';
import { join } from 'path';
import FilmListings from '../Components/FilmListings';
import { Cinema } from '../types';

interface Props {
  cinemas: Cinema[];
}

export default function Page({ cinemas }: Props) {
  return <FilmListings cinemas={cinemas} />;
}

export function getStaticProps() {
  const filePath = join(process.cwd(), 'src/data/showtimes.json');
  const data = readFileSync(filePath, 'utf-8');
  const cinemas: Cinema[] = JSON.parse(data);

  return {
    props: {
      cinemas,
    },
  };
}
