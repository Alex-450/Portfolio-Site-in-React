import React from 'react';
import blogPostArchive from '../blogPostArchive';
import { Row, Col, Card, Container } from 'react-bootstrap';

class BlogPosts extends React.Component {
    constructor(props) {
        super(props);
        this.state = { blogPosts : blogPostArchive };
    }
   
    render() {
    return(
            <Row>
                <Col>
                    <Card>
                        <Card.Body>
                        <Card.Text>{this.state.blogPosts.blog1.blogBody}</Card.Text>
                        </Card.Body>
                    </Card>
                   
                </Col>
            </Row>
    )
}
}

export default BlogPosts;