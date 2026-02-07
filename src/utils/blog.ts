import blogPostArchive from '../blogPostArchive.json';
import {
  BlogPost,
  FilmBlogPost,
  CreativeWritingBlogPost,
  TechBlogPost,
} from '../types';

type BlogPostType = BlogPost['type'];

type BlogPostByType = {
  film: FilmBlogPost;
  'creative-writing': CreativeWritingBlogPost;
  tech: TechBlogPost;
};

function findPost<T extends BlogPostType>(
  type: T,
  matcher: (blog: BlogPostByType[T]) => boolean
): BlogPostByType[T] {
  const posts = blogPostArchive as BlogPost[];
  const filtered = posts.filter((p): p is BlogPostByType[T] => p.type === type);
  const blog = filtered.find(matcher);
  if (!blog) {
    throw new Error(`${type} post not found`);
  }
  return blog;
}

export function findFilmPost(
  matcher: (blog: FilmBlogPost) => boolean
): FilmBlogPost {
  return findPost('film', matcher);
}

export function findCreativeWritingPost(
  matcher: (blog: CreativeWritingBlogPost) => boolean
): CreativeWritingBlogPost {
  return findPost('creative-writing', matcher);
}

export function findTechPost(
  matcher: (blog: TechBlogPost) => boolean
): TechBlogPost {
  return findPost('tech', matcher);
}
