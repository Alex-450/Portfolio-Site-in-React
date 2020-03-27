import React from 'react';
import NavBar from './NavBar';
import Footer from './Footer';
import blogPostArchive from '../blogPostArchive.json';
import { Col, Card, Button, Container } from 'react-bootstrap';
import Blog1 from '../Blog1.js';
import Blog2 from '../Blog2.js';
import BlackPantherImage from '../images/blackPantherImage.jpg';
import GrandBudapestHotelImage from '../images/grandBudapest.jpg'

class Blog extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            blogPosts: blogPostArchive,
            postLoadedOne: false,
            postLoadedTwo: false,
        };
    }

    loadBlogPostOne = () => {
        this.setState({postLoadedOne: true});
    }

    hideBlogPostOne = () => {
        this.setState({postLoadedOne: false})
    }

    loadBlogPostTwo = () => {
        this.setState({postLoadedTwo: true});
    }

    hideBlogPostTwo = () => {
        this.setState({postLoadedTwo: false})
    }
        
    render() {
    return(
        <div>
            <NavBar />
            <Container className="title-container">
            <h2 className="page-title-blog">My Personal Blog</h2>

                    <Col xs={12} md={{span: 8, offset: 2}}>
                        <Card className="blog-card">
                            <Card.Body>
                                <Card.Title className="blog-title-text">{this.state.blogPosts.blog1.title}</Card.Title>
                                <Card.Img variant="top" src={BlackPantherImage} />
                                <Card.Text className="blog-body-text">{this.state.postLoadedOne && <Blog1 />}</Card.Text>
                                {!this.state.postLoadedOne && <Button onClick={this.loadBlogPostOne} className="generic-button">Show blog ↓</Button>}
                                {this.state.postLoadedOne && <Button onClick={this.hideBlogPostOne} className="generic-button">Hide blog ↑</Button>}
                            </Card.Body>
                        <Card.Footer>{this.state.blogPosts.blog1.dateAdded}</Card.Footer>
                    </Card>
                    <br />
                </Col>
                    <Col xs={12} md={{span: 8, offset: 2}}>
                        <Card className="blog-card">
                            <Card.Body>
                                <Card.Title className="blog-title-text">{this.state.blogPosts.blog2.title}</Card.Title>
                                <Card.Img variant="top" src={GrandBudapestHotelImage} />
                                <Card.Text className="blog-body-text">{this.state.postLoadedTwo && <Blog2 />}</Card.Text>
                                {!this.state.postLoadedTwo && <Button onClick={this.loadBlogPostTwo} className="generic-button">Show blog ↓</Button>}
                                {this.state.postLoadedTwo && <Button onClick={this.hideBlogPostTwo} className="generic-button">Hide blog ↑</Button>}
                            </Card.Body>
                        <Card.Footer>{this.state.blogPosts.blog2.dateAdded}</Card.Footer>
                    </Card>
                </Col>
        </Container>
        <Footer />
        </div>
    )
}
}

export default Blog;