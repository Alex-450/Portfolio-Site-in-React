import { useState } from 'react';
import Link from 'next/link';
import { Container, Col, Row } from 'react-bootstrap';
import { ArrowRight } from 'lucide-react';
import blogPostArchive from '../blogPostArchive.json';
import { BlogPost } from '../types';
import { CATEGORIES, CategoryFilter } from '../data/blogCategories';

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

interface BlogArchiveProps {
  activeCategory: CategoryFilter;
}

const BlogArchive = ({ activeCategory }: BlogArchiveProps) => {
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
          ({ key, slug, label }) => (
            <Link
              key={key}
              href={`/blog/${slug}`}
              className={`blog-pill ${activeCategory === key ? 'blog-pill-active' : ''}`}
            >
              {label}
            </Link>
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

export default BlogArchive;
