import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive.json';
import { Row, Col, Card, Button, Container, CardColumns } from 'react-bootstrap';

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

    hideBlogPost = () => {
        this.setState({postsLoaded: false})
    }
        
    render() {
    return(
        <div>
            <NavBar />
            <Container className="title-container">
                <Row>
                    <Col>
                        <Card>
                            <Card.Body>
                                <Card.Title>{this.state.blogPosts.blog1.title}</Card.Title>
                                <Card.Text>{this.state.postsLoaded && this.state.blogPosts.blog1.blogBody}</Card.Text>
                                {!this.state.postsLoaded && <Button onClick={this.loadBlogPost} className="generic-button">Show blog ↓</Button>}
                                {this.state.postsLoaded && <Button onClick={this.hideBlogPost} className="generic-button">Hide blog ↑</Button>}
                            </Card.Body>
                        <Card.Footer>{this.state.blogPosts.blog1.dateAdded}</Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
        <Footer />
        </div>
    )
}
}

export default Blog;