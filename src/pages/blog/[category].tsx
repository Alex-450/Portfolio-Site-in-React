import { GetStaticPaths, GetStaticProps } from 'next';
import BlogArchive from '../../Components/BlogArchive';
import {
  CATEGORIES,
  CategoryFilter,
  getCategoryBySlug,
} from '../../data/blogCategories';

interface CategoryPageProps {
  category: CategoryFilter;
}

const Page = ({ category }: CategoryPageProps) => (
  <BlogArchive activeCategory={category} />
);

export const getStaticPaths: GetStaticPaths = () => ({
  paths: CATEGORIES.map(({ slug }) => ({ params: { category: slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<CategoryPageProps> = ({
  params,
}) => {
  const category = getCategoryBySlug(params?.category as string);
  if (!category) return { notFound: true };

  return { props: { category: category.key } };
};

export default Page;
