import type { MetadataRoute } from 'next'
import blogPostArchive from '../blogPostArchive.json'

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://a-450.com'
  const blogPages = blogPostArchive.flatMap((blog) => ({
    url: `${baseUrl}/${blog.link}`,
    lastModified: blog.dateAdded,
  }))

  return [
    { url: baseUrl, lastModified: new Date().toISOString() }, // homepage
    ...blogPages,
  ]
}
