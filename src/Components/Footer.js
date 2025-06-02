import '../css/index.css';
import { Container, Nav, Row, Col } from 'react-bootstrap';

const Footer = () => (
    <div className="footer-container">
        <Container>
            <Row>
                <Col xs={12} md={4} className="footer-explainer">
                <p>External Links ↓</p>
                </Col>
            </Row>
                <Col xs={12} md={4}>
                    <Nav fixed="bottom" className="flex-column">
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://github.com/Alex-450" target="_blank" rel="noopener noreferrer">Github →</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link className="footer-link" href="https://www.linkedin.com/in/alexander-s-96262914b/" target="_blank" rel="noopener">LinkedIn →</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>
                <Row>
                    <Col xs={12} md={{span: 4, offset: 4}} className="footer-explainer">
                    <p>Contact ↓</p>
                    </Col>
                </Row>
                <Col xs={12} md={{span: 4, offset: 4}}>
                    <Nav fixed="bottom" className="flex-column">
                            <Nav.Item>
                                <Nav.Link className="footer-link" href="/contact">Get in touch →</Nav.Link>
                            </Nav.Item>
                    </Nav>
                </Col>
                <Row>
                <Col xs={12} md={{span: 4, offset: 8}} className="footer-explainer">
                <p>Sitemap ↓</p>
                </Col>
                </Row>
                <Col xs={12} md={{span: 4, offset: 8}}>
                <Nav fixed="bottom" className="flex-column">
                  <Nav.Item>
                      <Nav.Link className="footer-link" href="/">Home →</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                      <Nav.Link className="footer-link" href="/about">About →</Nav.Link>
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
