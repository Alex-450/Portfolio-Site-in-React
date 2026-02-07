import blogPostArchive from '../../blogPostArchive.json';
import { BlogPost } from '../../types';

export const dynamic = 'force-static';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatRFC822(date: Date): string {
  return date.toUTCString();
}

function getItemTitle(post: BlogPost): string {
  if (post.type === 'film' || post.type === 'tech') {
    return `${post.title} - ${post.topic}`;
  }
  return `${post.title} - ${post.location}`;
}

export async function GET() {
  const baseUrl = 'https://a-450.com';
  const posts = blogPostArchive as BlogPost[];

  // Filter to only posts with required fields, then sort by date, newest first
  const sortedPosts = [...posts]
    .filter((post) => post.link && post.description)
    .sort((a, b) => {
      return parseDate(b.dateAdded).getTime() - parseDate(a.dateAdded).getTime();
    });

  const items = sortedPosts
    .map((post) => {
      const pubDate = formatRFC822(parseDate(post.dateAdded));

      return `    <item>
      <title>${escapeXml(getItemTitle(post))}</title>
      <link>${baseUrl}${post.link}</link>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Alex Stearn</title>
    <link>${baseUrl}</link>
    <description>Film analysis and creative writing by Alex Stearn</description>
    <language>en-gb</language>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
