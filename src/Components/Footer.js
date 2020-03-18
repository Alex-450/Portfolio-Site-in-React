import React from 'react';
import { Container, Nav, Row, Col } from 'react-bootstrap';

const Footer = () => (
        <Container>
            <Row>
                <Col>
                    <Nav fixed="bottom">
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://www.facebook.com/alex.stearn.5/" target="_blank" rel="noopener noreferrer">Facebook →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://github.com/Alex-450" target="_blank" rel="noopener noreferrer">Github →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://www.linkedin.com/in/alexander-stearn-96262914b/" target="_blank" rel="noopener">LinkedIn →</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>
            </Row>
        </Container>
    );
    
export default Footer;