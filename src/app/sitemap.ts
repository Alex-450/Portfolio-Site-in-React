import type { MetadataRoute } from 'next'
import blogPostArchive from '../blogPostArchive.json'

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://a-450.com'

  const blogPages = blogPostArchive.flatMap((blog) => {
    const [day, month, year] = blog.dateAdded.split('/').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    return {
      url: `${baseUrl}${blog.link}`,
      lastModified: date.toISOString(),
    }
  })

  return [
    { url: baseUrl, lastModified: new Date().toISOString() }, // homepage
    ...blogPages,
  ]
}
