import '../css/index.css';
import { Container, Row, Col } from 'react-bootstrap';
import {  Link } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const Footer = () => (
    <div className="footer-container">
      <Container className="footer-container">
        <Row>
          <Col md={4} className="d-flex flex-column align-items-start">
            <p className="footer-explainer">External Links ↓</p>
            <a className="footer-link" href="https://github.com/Alex-450" target="_blank" rel="noopener noreferrer">Github →</a>
            <a className="footer-link" href="https://www.linkedin.com/in/alexander-s-96262914b/" target="_blank" rel="noopener noreferrer">LinkedIn →</a>
          </Col>

          <Col md={4} className="d-flex flex-column align-items-start">
            <p className="footer-explainer">Options ↓</p>
            <DarkModeToggle />
          </Col>


          <Col md={4} className="d-flex flex-column align-items-start">
            <p className="footer-explainer">Sitemap ↓</p>
            <Link className="footer-link" to="/">Blog →</Link>
          </Col>
        </Row>
      </Container>
    </div>
    );

export default Footer;
