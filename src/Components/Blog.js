import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive';
import { Row, Col, Card, Button, Container, CardColumns } from 'react-bootstrap';
import BlogPosts from './BlogPosts';

class Blog extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            blogPosts: blogPostArchive,
            postsLoaded: false
        };
    }

    loadBlogPost = () => {
        this.setState({postsLoaded: true});
    }
        
    render() {
    return(
        <div>
            <NavBar />
            <Container>
                <Row>
                    <Col>
                        <Card>
                            <Card.Body>
                                <Card.Title>{this.state.blogPosts.blog1.title}</Card.Title>
                                <Card.Text>{this.state.postsLoaded && <BlogPosts />}</Card.Text>
                                <Button onClick={this.loadBlogPost}>Load blog</Button>  
                            </Card.Body>
                        <Card.Footer>{this.state.blogPosts.blog1.dateAdded}</Card.Footer>
                    </Card>
                </Col>
            </Row>
        
            <Footer />
        </Container>

        </div>
    )
}
}

export default Blog;