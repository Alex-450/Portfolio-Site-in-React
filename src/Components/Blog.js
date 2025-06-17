import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive.json';
import { Col, Card, Button, Container } from 'react-bootstrap';

const Blog = () => {
  return(
    <div>
      <NavBar />
      <Container className="title-container">
        <h2 className="page-title-blog">Blog</h2>
        {blogPostArchive.map(blog => (
           <Col xs={12} md={{span: 8, offset: 2}}>
            <Card className="blog-card">
            <Card.Body>
              <Card.Title className="blog-title-text">{blog.title}</Card.Title>
              <Card.Img variant="top" src={`/images/${blog.imageSrc}`} />
              <Card.Text className="blog-body-text">
                <Button as="a" className="generic-button" href={blog.link}>Read →</Button>
              </Card.Text>
              </Card.Body>
                <Card.Footer>{blog.dateAdded}</Card.Footer>
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
