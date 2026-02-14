export interface Cinema {
  name: string;
  address: string;
  adsMinutes: number;
}

export const cinemas: Record<string, Cinema> = {
  LAB111: {
    name: 'LAB111',
    address: 'Arie Biemondstraat 111, 1054 PD Amsterdam',
    adsMinutes: 20,
  },
  Kriterion: {
    name: 'Kriterion',
    address: 'Roetersstraat 170, 1018 WE Amsterdam',
    adsMinutes: 20,
  },
  Eye: {
    name: 'Eye Filmmuseum',
    address: 'IJpromenade 1, 1031 KT Amsterdam',
    adsMinutes: 20,
  },
  'Studio K': {
    name: 'Studio K',
    address: 'Timorplein 62, 1094 CC Amsterdam',
    adsMinutes: 20,
  },
  FilmHallen: {
    name: 'FilmHallen',
    address: 'Hannie Dankbaarpassage 12, 1053 RT Amsterdam',
    adsMinutes: 20,
  },
  'The Movies': {
    name: 'The Movies',
    address: 'Haarlemmerdijk 161, 1013 KH Amsterdam',
    adsMinutes: 20,
  },
  FilmKoepel: {
    name: 'FilmKoepel',
    address: 'Haarlemmerplein 7, 2023 AA Haarlem',
    adsMinutes: 20,
  },
  'FC Hyena': {
    name: 'FC Hyena',
    address: 'Aambeeldstraat 24, 1021 KB Amsterdam',
    adsMinutes: 20,
  },
};

export function getCinema(name: string): Cinema | undefined {
  return cinemas[name];
}
