import NavBar from './NavBar';
import Footer from './Footer';
import 'bootstrap/dist/css/bootstrap.min.css';
import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom'

const Blog = () => {
  return(
    <div className="d-flex flex-column min-vh-100 blog-container">
      <NavBar />
      <Container className="title-container flex-grow-1">
        <h1>Blog</h1>
        <div className="d-none d-sm-block">
          <Row className="blog-header">
            <Col md={2}>Date</Col>
            <Col>Title</Col>
          </Row>
        </div>
        {blogPostArchive.map((blog, index) => (
        <Link to={blog.link} className="blog-link" key={blog.title}>
          <Row className="blog-row slide-in" style={{ animationDelay: `0.${index + 1}s` }}>
            <Col md={2}>
              <div>{blog.dateAdded}</div>
            </Col>
            <Col>
              <div>{blog.filmName} | {blog.title} →</div>
            </Col>
            <br></br>
          </Row>
        </Link>
        ))}
      </Container>
      <Footer />
    </div>
    )
}

export default Blog;
