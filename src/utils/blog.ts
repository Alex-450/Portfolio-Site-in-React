import blogPostArchive from '../blogPostArchive.json';
import { BlogPost, FilmBlogPost, CreativeWritingBlogPost } from '../types';

export function findFilmPost(
  matcher: (blog: FilmBlogPost) => boolean
): FilmBlogPost {
  const posts = blogPostArchive as BlogPost[];
  const filmPosts = posts.filter((p): p is FilmBlogPost => p.type === 'film');
  const blog = filmPosts.find(matcher);
  if (!blog) {
    throw new Error('Film post not found');
  }
  return blog;
}

export function findCreativeWritingPost(
  matcher: (blog: CreativeWritingBlogPost) => boolean
): CreativeWritingBlogPost {
  const posts = blogPostArchive as BlogPost[];
  const creativeWritingPosts = posts.filter(
    (p): p is CreativeWritingBlogPost => p.type === 'creative-writing'
  );
  const blog = creativeWritingPosts.find(matcher);
  if (!blog) {
    throw new Error('Creative writing post not found');
  }
  return blog;
}
