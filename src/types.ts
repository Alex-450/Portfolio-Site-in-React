import { ReactNode } from 'react';

// Blog post types for the archive/index
interface BaseBlogPost {
  title: string;
  link: string;
  dateAdded: string;
  description: string;
  archived?: boolean;
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

export interface TechBlogPost extends BaseBlogPost {
  type: 'tech';
  topic: string;
}

export type BlogPost = FilmBlogPost | CreativeWritingBlogPost | TechBlogPost;

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

export interface TechMetadata extends BaseMetadata {
  type: 'tech';
  topic: string;
}

export type ArticleMetadata = FilmMetadata | CreativeWritingMetadata | TechMetadata;

export interface ArticleLayoutProps {
  metadata: ArticleMetadata;
  children: ReactNode;
}

export interface YouTubeEmbedProps {
  videoId: string;
}

// Film listings types
export interface Showtime {
  date: string;
  time: string;
  ticketUrl: string;
  screen: string;
}

// Film-grouped structure for UI
export interface CinemaShowtimes {
  cinema: string;
  showtimes: Showtime[];
  variant?: string | null; // e.g., "50th Anniversary", "ENG SUBS"
  subtitles?: string | null; // e.g., "NL", "EN", or null if unknown
}

export interface FilmWithCinemas {
  slug: string;
  title: string;
  director: string | null;
  length: string | null;
  posterUrl: string;
  genres?: string[];
  cinemaShowtimes: CinemaShowtimes[];
  dateAdded?: string;
}

// TMDB data for film detail pages
export interface TmdbData {
  id: number;
  overview: string | null;
  releaseDate: string | null;
  releaseDateNl: string | null;
  runtime: number | null;
  genres: string[];
  youtubeTrailerId: string | null;
}

// Full film data for detail pages
export interface FilmDetail {
  slug: string;
  title: string;
  director: string | null;
  length: string | null;
  posterUrl: string;
  tmdb: TmdbData | null;
  cinemaShowtimes: CinemaShowtimes[];
  dateAdded?: string;
}

// Films index (slug -> FilmDetail)
export interface FilmsIndex {
  [slug: string]: FilmDetail;
}

// Slimmed-down types for listings page (excludes fields not needed for cards)
export interface ShowtimeLite {
  date: string;
  time: string;
  ticketUrl: string;
  screen: string;
}

export interface CinemaShowtimesLite {
  cinema: string;
  showtimes: ShowtimeLite[];
  variant?: string | null;
  subtitles?: string | null; // e.g., "NL", "EN", or null if unknown
}

export interface FilmWithCinemasLite {
  slug: string;
  title: string;
  director: string | null;
  length: string | null;
  posterUrl: string;
  genres: string[];
  cinemaShowtimes: CinemaShowtimesLite[];
  dateAdded?: string | null;
  releaseDate?: string | null;
}

export interface FilmsIndexLite {
  [slug: string]: FilmWithCinemasLite;
}
