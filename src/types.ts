import { ReactNode } from 'react';

export interface BlogPost {
  title: string;
  topic: string;
  year: string;
  director: string;
  link: string;
  dateAdded: string;
}

export interface ArticleMetadata {
  topic: string;
  year: string;
  title: string;
  director: string;
  author: string;
  keywords: string;
  description: string;
  spoilers?: boolean;
}

export interface ArticleLayoutProps {
  metadata: ArticleMetadata;
  children: ReactNode;
}

export interface YouTubeEmbedProps {
  videoId: string;
}
