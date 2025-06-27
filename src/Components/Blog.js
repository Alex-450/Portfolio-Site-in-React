import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive.json';
import { Container, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom'

const Blog = () => {
  return(
    <div>
      <NavBar />
      <Container className="title-container">
        <h1>Blog</h1>
          {blogPostArchive.map((blog, index) => (
          <Link to={blog.link} className="blog-link">
            <Row className="blog-row slide-in" style={{ animationDelay: `0.${index + 1}s` }}>
              <Col md={1}>
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
