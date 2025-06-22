import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive.json';
import { Col, Card, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom'

const Blog = () => {
  return(
    <div>
      <NavBar />
      <Container className="title-container">
        {blogPostArchive.map(blog => (
           <Col xs={12} md={{span: 8, offset: 2}}>
            <Card className="blog-card" as={Link} to={blog.link}>
              <Card.Body className="card-button">
                <Card.Title className="blog-title-text">{blog.title} →</Card.Title>
              </Card.Body>
              <Card.Footer className="blog-footer">{blog.dateAdded}</Card.Footer>
            </Card>
            <br />
           </Col>
      ))}
      </Container>
      <Footer />
    </div>
    )
}

export default Blog;
