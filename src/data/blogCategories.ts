import { BlogPost } from '../types';

// `key` matches BlogPost['type'] in blogPostArchive.json; `slug` is the URL
// segment, which differs where the plural reads better in the address bar.
export type CategoryFilter = BlogPost['type'];

export const CATEGORIES: {
  key: CategoryFilter;
  slug: string;
  label: string;
}[] = [
  { key: 'film', slug: 'film', label: 'Film' },
  {
    key: 'creative-writing',
    slug: 'creative-writing',
    label: 'Creative Writing',
  },
  { key: 'tech', slug: 'tech', label: 'Tech' },
  { key: 'book', slug: 'books', label: 'Books' },
];

export const DEFAULT_CATEGORY: CategoryFilter = 'film';

export const getCategoryBySlug = (slug: string) =>
  CATEGORIES.find((category) => category.slug === slug);
