import React from 'react';
import '../css/index.css';
import { Container, Nav, Row, Col } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const Footer = () => (
    <div className="footer-container">
        <Container>
            <Row>
                <Col xs={3} md={3} className="footer-explainer">
                <p>External Links ↓</p>
                </Col>
            </Row>
                <Col xs={3} md={3}>
                    <Nav fixed="bottom" className="flex-column">
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://www.facebook.com/alex.stearn.5/" target="_blank" rel="noopener noreferrer">Facebook →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://github.com/Alex-450" target="_blank" rel="noopener noreferrer">Github →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://www.linkedin.com/in/alexander-stearn-96262914b/" target="_blank" rel="noopener">LinkedIn →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://twitter.com/AlexanderStearn" target="_blank" rel="noopener">Twitter →</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>
                <Row>
                    <Col xs={3} md={{span: 3, offset: 5}} className="footer-explainer">
                    <p>Contact ↓</p>
                    </Col>
                </Row>
                <Col xs={3} md={{span: 3, offset: 5}}>
                    <Nav fixed="bottom" className="flex-column">
                            <Nav.Item>
                                <Nav.Link className="footer-link" href="/contact">Get in touch →</Nav.Link>
                            </Nav.Item>
                    </Nav>
                </Col>
                <Row>
                <Col xs={3} md={{span: 3, offset: 10}} className="footer-explainer">
                <p>Sitemap ↓</p>
                </Col>
                </Row>
                <Col xs={3} md={{span: 3, offset: 10}}>
                <Nav fixed="bottom" className="flex-column">
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="/">Home →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="/about">About →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="/contact">Contact →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="/blog">Blog →</Nav.Link>
                        </Nav.Item>
                </Nav>
                </Col>
        </Container>
    </div>
    );
    
export default Footer;