import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive.json';
import { Col, Card, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom'

const Blog = () => {
  return(
    <div>
      <NavBar />
      <Container className="title-container">
        <h2 className="page-title-blog">Blog</h2>
        {blogPostArchive.map(blog => (
           <Col xs={12} md={{span: 8, offset: 2}}>
            <Card className="blog-card">
              <Button as={Link} to={blog.link} className="generic-button">
                <Card.Body>
                  <Card.Title className="blog-title-text">{blog.title} →</Card.Title>
                </Card.Body>
              <Card.Footer>{blog.dateAdded}</Card.Footer>
              </Button>
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
