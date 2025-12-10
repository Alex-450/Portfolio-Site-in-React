import blogPostArchive from '../blogPostArchive.json';
import { BlogPost } from '../types';

export function findBlogPost(matcher: (blog: BlogPost) => boolean): BlogPost {
  const posts: BlogPost[] = blogPostArchive;
  const blog = posts.find(matcher);
  if (!blog) {
    throw new Error('Blog post not found');
  }
  return blog;
}
