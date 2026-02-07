import blogPostArchive from '../blogPostArchive.json';
import {
  BlogPost,
  FilmBlogPost,
  CreativeWritingBlogPost,
  TechBlogPost,
} from '../types';

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

export function findTechPost(
  matcher: (blog: TechBlogPost) => boolean
): TechBlogPost {
  const posts = blogPostArchive as BlogPost[];
  const techPosts = posts.filter((p): p is TechBlogPost => p.type === 'tech');
  const blog = techPosts.find(matcher);
  if (!blog) {
    throw new Error('Tech post not found');
  }
  return blog;
}
