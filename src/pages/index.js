import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';

const Page = () => {
  return(
    <Container className="title-container flex-grow-1">
      <h1>Blog</h1>
      <div className="d-none d-sm-block">
        <Row className="blog-header">
          <Col md={2}>Date</Col>
          <Col>Title</Col>
        </Row>
      </div>
      {blogPostArchive.map((blog, index) => (
      <a href={blog.link} className="blog-link" key={blog.title}>
        <Row className="blog-row slide-in" style={{ animationDelay: `0.${index + 1}s` }}>
          <Col md={2}>
            <div>{blog.dateAdded}</div>
          </Col>
          <Col>
            <div>{blog.topic} | {blog.title} →</div>
          </Col>
          <br></br>
        </Row>
      </a>
      ))}
    </Container>
    )
}

export default Page;
