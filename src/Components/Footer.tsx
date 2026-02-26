import '../css/index.css';
import { Container, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import { ArrowRight, ArrowDown } from 'lucide-react';

const Footer = () => (
  <div className="footer-container">
    <Container>
      <Row>
        <Col xs={12} md={4} className="footer-explainer">
          <p>External Links <ArrowDown size={16} /></p>
        </Col>
      </Row>

      <Col xs={12} md={4}>
        <a
          className="footer-link"
          href="https://github.com/Alex-450"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github <ArrowRight size={16} />
        </a>
      </Col>

      <Col xs={12} md={4}>
        <a
          className="footer-link"
          href="https://www.linkedin.com/in/alexander-s-96262914b/"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn <ArrowRight size={16} />
        </a>
      </Col>

      <Col xs={12} md={4}>
        <a
          className="footer-link"
          href="https://letterboxd.com/a_450/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Letterboxd <ArrowRight size={16} />
        </a>
      </Col>

      <Row>
        <Col xs={12} md={{ span: 4, offset: 4 }} className="footer-explainer">
          <p>Options <ArrowDown size={16} /></p>
        </Col>
      </Row>

      <Row>
        <Col xs={12} md={{ span: 4, offset: 4 }}>
          <DarkModeToggle className="footer-link" />
        </Col>
      </Row>

      <Row className="d-flex">
        <Col xs={12} md={{ span: 4, offset: 8 }} className="footer-explainer">
          <p>Sitemap <ArrowDown size={16} /></p>
        </Col>
      </Row>

      <Row>
        <Col xs={12} md={{ span: 4, offset: 8 }}>
          <Link className="footer-link" href="/">
            Home <ArrowRight size={16} />
          </Link>
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={{ span: 4, offset: 8 }}>
          <Link className="footer-link" href="/blog">
            Blog <ArrowRight size={16} />
          </Link>
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={{ span: 4, offset: 8 }}>
          <Link className="footer-link" href="/film-listings">
            Film Listings <ArrowRight size={16} />
          </Link>
        </Col>
      </Row>
    </Container>
  </div>
);

export default Footer;
