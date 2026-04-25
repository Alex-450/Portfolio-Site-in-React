import { useState } from 'react';
import Link from 'next/link';
import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';
import { BlogPost } from '../types';
import { ArrowRight } from 'lucide-react';

type CategoryFilter = 'film' | 'creative-writing' | 'tech' | 'book';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'film', label: 'Film' },
  { key: 'creative-writing', label: 'Creative Writing' },
  { key: 'tech', label: 'Tech' },
  { key: 'book', label: 'Books' },
];

const getSubtitle = (blog: BlogPost) =>
  blog.type === 'creative-writing' ? blog.location : blog.topic;

const BlogRow = ({ blog, index }: { blog: BlogPost; index: number }) => (
  <Link href={blog.link} className="blog-link" key={blog.link}>
    <Row
      className="blog-row slide-in"
      style={{ animationDelay: `${index / 10 + 0.1}s` }}
    >
      <Col md={2}>{blog.dateAdded}</Col>
      <Col>
        {getSubtitle(blog)} | {blog.title} <ArrowRight size={16} />
      </Col>
    </Row>
  </Link>
);

const Page = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('film');
  const [showArchive, setShowArchive] = useState(false);
  const posts: BlogPost[] = blogPostArchive as BlogPost[];

  const activeCategories = new Set(
    posts.filter((p) => !p.archived).map((p) => p.type)
  );

  const filteredPosts = posts.filter(
    (post) => post.type === activeCategory && !post.archived
  );
  const archivedPosts = posts.filter(
    (post) => post.type === activeCategory && post.archived
  );

  return (
    <Container className="title-container flex-grow-1">
      <h1>Blog</h1>
      <div className="blog-pills">
        {CATEGORIES.filter(({ key }) => activeCategories.has(key)).map(
          ({ key, label }) => (
            <button
              key={key}
              className={`blog-pill ${activeCategory === key ? 'blog-pill-active' : ''}`}
              onClick={() => setActiveCategory(key)}
            >
              {label}
            </button>
          )
        )}
      </div>
      <Row className="blog-header">
        <Col md={2}>Date</Col>
        <Col>Title</Col>
      </Row>
      {filteredPosts.map((blog, index) => (
        <BlogRow key={blog.link} blog={blog} index={index} />
      ))}
      {archivedPosts.length > 0 && (
        <>
          <button
            className="archive-toggle"
            onClick={() => setShowArchive(!showArchive)}
          >
            {showArchive ? 'Hide archive' : 'Show archive'}
          </button>
          {showArchive &&
            archivedPosts.map((blog, index) => (
              <BlogRow key={blog.link} blog={blog} index={index} />
            ))}
        </>
      )}
    </Container>
  );
};

export default Page;
