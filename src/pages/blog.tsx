import { useState } from 'react';
import Link from 'next/link';
import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';
import { BlogPost, FilmBlogPost, CreativeWritingBlogPost } from '../types';

type CategoryFilter = 'film' | 'creative-writing' | 'tech';

const Page = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('film');
  const [showArchive, setShowArchive] = useState(false);
  const posts: BlogPost[] = blogPostArchive as BlogPost[];

  const hasFilmPosts = posts.some((p) => p.type === 'film' && !p.archived);
  const hasCreativeWritingPosts = posts.some(
    (p) => p.type === 'creative-writing' && !p.archived
  );
  const hasTechPosts = posts.some((p) => p.type === 'tech' && !p.archived);

  const filteredPosts = posts.filter(
    (post) => post.type === activeCategory && !post.archived
  );
  const archivedPosts = posts.filter(
    (post) => post.type === activeCategory && post.archived
  );

  const getSubtitle = (blog: BlogPost) => {
    if (blog.type === 'film') return blog.topic;
    if (blog.type === 'creative-writing') return blog.location;
    if (blog.type === 'tech') return blog.topic;
    return '';
  };

  return (
    <Container className="title-container flex-grow-1">
      <h1>Blog</h1>
      <div className="blog-pills">
        {hasFilmPosts && (
          <button
            className={`blog-pill ${activeCategory === 'film' ? 'blog-pill-active' : ''}`}
            onClick={() => setActiveCategory('film')}
          >
            Film
          </button>
        )}
        {hasCreativeWritingPosts && (
          <button
            className={`blog-pill ${activeCategory === 'creative-writing' ? 'blog-pill-active' : ''}`}
            onClick={() => setActiveCategory('creative-writing')}
          >
            Creative Writing
          </button>
        )}
        {hasTechPosts && (
          <button
            className={`blog-pill ${activeCategory === 'tech' ? 'blog-pill-active' : ''}`}
            onClick={() => setActiveCategory('tech')}
          >
            Tech
          </button>
        )}
      </div>
      <Row className="blog-header">
        <Col md={2}>Date</Col>
        <Col>Title</Col>
      </Row>
      {filteredPosts.map((blog, index) => (
        <Link href={blog.link} className="blog-link" key={blog.title}>
          <Row
            className="blog-row slide-in"
            style={{ animationDelay: `${index / 10 + 0.1}s` }}
          >
            <Col md={2}>{blog.dateAdded}</Col>
            <Col>
              {getSubtitle(blog)} | {blog.title} ›
            </Col>
          </Row>
        </Link>
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
              <Link href={blog.link} className="blog-link" key={blog.title}>
                <Row
                  className="blog-row slide-in"
                  style={{ animationDelay: `${index / 10 + 0.1}s` }}
                >
                  <Col md={2}>{blog.dateAdded}</Col>
                  <Col>
                    {getSubtitle(blog)} | {blog.title} ›
                  </Col>
                </Row>
              </Link>
            ))}
        </>
      )}
    </Container>
  );
};

export default Page;
