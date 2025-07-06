import '../css/index.css';
import { Container, Row, Col } from 'react-bootstrap';
import DarkModeToggle from './DarkModeToggle';

const Footer = () => (
    <div className="footer-container">
      <Container>
        <Row>
          <Col xs={12} md={4} className="footer-explainer">
            <p >External Links ↓</p>
          </Col>
        </Row>

        <Col xs={12} md={4}>
          <a className="footer-link" href="https://github.com/Alex-450" target="_blank" rel="noopener noreferrer">Github →</a>
        </Col>

        <Col xs={12} md={4}>
          <a className="footer-link" href="https://www.linkedin.com/in/alexander-s-96262914b/" target="_blank" rel="noopener noreferrer">LinkedIn →</a>
        </Col>

      <Row>
        <Col xs={12} md={{span: 4, offset: 4}} className="footer-explainer">
          <p>Options ↓</p>
        </Col>
      </Row>

      <Row>
        <Col xs={12} md={{span: 4, offset: 4}}>
          <DarkModeToggle />
        </Col>
      </Row>

      <Row className="d-flex">
        <Col xs={12} md={{span: 4, offset: 8}} className="footer-explainer">
          <p>Sitemap ↓</p>
        </Col>
      </Row>

      <Row>
        <Col xs={12} md={{span: 4, offset: 8}}>
          <a className="footer-link" href="/">Blog →</a>
        </Col>
      </Row>
      </Container>
    </div>
    );

export default Footer;
