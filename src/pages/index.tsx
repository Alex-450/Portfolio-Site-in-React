import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';
import { BlogPost, FilmBlogPost, CreativeWritingBlogPost } from '../types';

const Page = () => {
  const posts: BlogPost[] = blogPostArchive as BlogPost[];

  const getSubtitle = (blog: BlogPost) => {
    if (blog.type === 'film') return (blog as FilmBlogPost).topic;
    if (blog.type === 'creative-writing') return (blog as CreativeWritingBlogPost).location;
    return '';
  };

  return(
    <Container className="title-container flex-grow-1">
      <h1>Blog</h1>
      <div className="d-none d-sm-block">
        <Row className="blog-header">
          <Col md={2}>Date</Col>
          <Col>Title</Col>
        </Row>
      </div>
      {posts.map((blog, index) => (
      <a href={blog.link} className="blog-link" key={blog.title}>
        <Row className="blog-row slide-in" style={{ animationDelay: `0.${index + 1}s` }}>
          <Col md={2}>
            <div>{blog.dateAdded}</div>
          </Col>
          <Col>
            <div>{getSubtitle(blog)} | {blog.title} →</div>
          </Col>
          <br></br>
        </Row>
      </a>
      ))}
    </Container>
    )
}

export default Page;
