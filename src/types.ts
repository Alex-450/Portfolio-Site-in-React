import { ReactNode } from 'react';

// Blog post types for the archive/index
interface BaseBlogPost {
  title: string;
  link: string;
  dateAdded: string;
  description: string;
}

export interface FilmBlogPost extends BaseBlogPost {
  type: 'film';
  topic: string;
  year: string;
  director: string;
}

export interface CreativeWritingBlogPost extends BaseBlogPost {
  type: 'creative-writing';
  location: string;
  year: string;
}

export type BlogPost = FilmBlogPost | CreativeWritingBlogPost;

// Article metadata types for the layout
interface BaseMetadata {
  title: string;
  keywords: string;
  author?: string;
  description?: string;
}

export interface FilmMetadata extends BaseMetadata {
  type: 'film';
  topic: string;
  year: string;
  director: string;
  spoilers?: boolean;
}

export interface CreativeWritingMetadata extends BaseMetadata {
  type: 'creative-writing';
  location: string;
  year: string;
}

export type ArticleMetadata = FilmMetadata | CreativeWritingMetadata;

export interface ArticleLayoutProps {
  metadata: ArticleMetadata;
  children: ReactNode;
}

export interface YouTubeEmbedProps {
  videoId: string;
}
