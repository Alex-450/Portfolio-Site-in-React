import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';
import { BlogPost, FilmBlogPost, CreativeWritingBlogPost } from '../types';

const Page = () => {
  const posts: BlogPost[] = blogPostArchive as BlogPost[];

  const getSubtitle = (blog: BlogPost) => {
    if (blog.type === 'film') return (blog as FilmBlogPost).topic;
    if (blog.type === 'creative-writing')
      return (blog as CreativeWritingBlogPost).location;
    return '';
  };

  return (
    <Container className="title-container flex-grow-1">
      <h1>Blog</h1>
      <Row className="blog-header">
        <Col md={2}>Date</Col>
        <Col>Title</Col>
      </Row>
      {posts.map((blog, index) => (
        <a href={blog.link} className="blog-link" key={blog.title}>
          <Row
            className="blog-row slide-in"
            style={{ animationDelay: `${index / 10 + 0.1}s` }}
          >
            <Col md={2}>{blog.dateAdded}</Col>
            <Col>
              {getSubtitle(blog)} | {blog.title} →
            </Col>
          </Row>
        </a>
      ))}
    </Container>
  );
};

export default Page;
