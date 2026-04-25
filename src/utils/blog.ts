import blogPostArchive from '../blogPostArchive.json';
import { BlogPost } from '../types';

export function findBlogPostByLink(link: string): BlogPost {
  const posts = blogPostArchive as BlogPost[];
  const blog = posts.find((b) => b.link === link);
  if (!blog) {
    throw new Error(`Blog post not found for link: ${link}`);
  }
  return blog;
}
