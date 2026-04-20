export interface Cinema {
  name: string;
  slug: string;
  address: string;
  websiteUrl: string;
  adsMinutes: number;
}

export const cinemas: Record<string, Cinema> = {
  LAB111: {
    name: 'LAB111',
    slug: 'lab111',
    address: 'Arie Biemondstraat 111, 1054 PD Amsterdam',
    websiteUrl: 'https://lab111.nl',
    adsMinutes: 20,
  },
  Eye: {
    name: 'Eye Filmmuseum',
    slug: 'eye',
    address: 'IJpromenade 1, 1031 KT Amsterdam',
    websiteUrl: 'https://www.eyefilm.nl',
    adsMinutes: 20,
  },
  'Studio K': {
    name: 'Studio K',
    slug: 'studio-k',
    address: 'Timorplein 62, 1094 CC Amsterdam',
    websiteUrl: 'https://studio-k.nu',
    adsMinutes: 20,
  },
  FilmHallen: {
    name: 'FilmHallen',
    slug: 'filmhallen',
    address: 'Hannie Dankbaarpassage 12, 1053 RT Amsterdam',
    websiteUrl: 'https://filmhallen.nl',
    adsMinutes: 20,
  },
  'The Movies': {
    name: 'The Movies',
    slug: 'the-movies',
    address: 'Haarlemmerdijk 161, 1013 KH Amsterdam',
    websiteUrl: 'https://themovies.nl',
    adsMinutes: 20,
  },
  FilmKoepel: {
    name: 'FilmKoepel',
    slug: 'filmkoepel',
    address: 'Haarlemmerplein 7, 2023 AA Haarlem',
    websiteUrl: 'https://filmkoepel.nl',
    adsMinutes: 20,
  },
  'FC Hyena': {
    name: 'FC Hyena',
    slug: 'fc-hyena',
    address: 'Aambeeldstraat 24, 1021 KB Amsterdam',
    websiteUrl: 'https://fchyena.nl',
    adsMinutes: 20,
  },
  Kriterion: {
    name: 'Kriterion',
    slug: 'kriterion',
    address: 'Roetersstraat 170, 1018 WE Amsterdam',
    websiteUrl: 'https://kriterion.nl',
    adsMinutes: 20,
  },
};

export function getCinema(name: string): Cinema | undefined {
  return cinemas[name];
}

export function getCinemaSlug(cinemaKey: string): string {
  return cinemas[cinemaKey]?.slug ?? cinemaKey.toLowerCase().replace(/\s+/g, '-');
}

export function getCinemaBySlug(
  slug: string
): { key: string; cinema: Cinema } | undefined {
  for (const [key, cinema] of Object.entries(cinemas)) {
    if (cinema.slug === slug) return { key, cinema };
  }
  return undefined;
}
