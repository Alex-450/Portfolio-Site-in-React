import type { MetadataRoute } from 'next';
import blogPostArchive from '../blogPostArchive.json';
import filmsData from '../data/films.json';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://a-450.com';

  const blogPages = blogPostArchive.flatMap((blog) => {
    const [day, month, year] = blog.dateAdded.split('/').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return {
      url: `${baseUrl}${blog.link}`,
      lastModified: date.toISOString(),
    };
  });

  const filmPages = Object.values(filmsData).map((film) => ({
    url: `${baseUrl}/films/${film.slug}`,
    lastModified: new Date(film.dateAdded).toISOString(),
  }));

  return [
    { url: baseUrl, lastModified: new Date().toISOString() },
    { url: `${baseUrl}/blog`, lastModified: new Date().toISOString() },
    { url: `${baseUrl}/film-listings`, lastModified: new Date().toISOString() },
    ...blogPages,
    ...filmPages,
  ];
}
