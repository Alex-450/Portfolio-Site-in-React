import Link from 'next/link';
import { Container, Row, Col } from 'react-bootstrap';
import { ArrowRight } from 'lucide-react';

const HomePage = () => {
  return (
    <Container className="home-container flex-grow-1">
      <Row className="slide-in">
        <Col xs={{ span: 10, offset: 1 }} md={{ span: 6, offset: 0 }} className="home-intro-line">
          <p>My name is Alex.</p>
        </Col>
      </Row>
      <Row className="slide-in" style={{ animationDelay: '0.3s' }}>
        <Col xs={{ span: 10, offset: 1 }} md={{ span: 6, offset: 1 }} className="home-intro-line">
          <p>I studied History and German.</p>
        </Col>
      </Row>
      <Row className="slide-in" style={{ animationDelay: '0.6s' }}>
        <Col xs={{ span: 10, offset: 1 }} md={{ span: 6, offset: 2 }} className="home-intro-line">
          <p>I did some teaching.</p>
        </Col>
      </Row>
      <Row className="slide-in" style={{ animationDelay: '0.9s' }}>
        <Col xs={{ span: 10, offset: 1 }} md={{ span: 6, offset: 3 }} className="home-intro-line">
          <p>I worked in a load of bars and restaurants.</p>
        </Col>
      </Row>
      <Row className="slide-in" style={{ animationDelay: '1.2s' }}>
        <Col xs={{ span: 10, offset: 1 }} md={{ span: 6, offset: 1 }} className="home-intro-line">
          <p>I did QA at <a href="https://rekki.com" target="_blank" rel="noopener noreferrer">REKKI</a>.</p>
        </Col>
      </Row>
      <Row className="slide-in" style={{ animationDelay: '1.5s' }}>
        <Col xs={{ span: 10, offset: 1 }} md={{ span: 6, offset: 2 }} className="home-intro-line">
          <p>Now I'm a software developer at <a href="https://fuga.com" target="_blank" rel="noopener noreferrer">FUGA</a>.</p>
        </Col>
      </Row>

      <section className="home-nav">
        <Link href="/blog" className="home-nav-link slide-in" style={{ animationDelay: '1.9s' }}>
          <div className="home-nav-content">
            <span className="home-nav-title">Blog</span>
            <span className="home-nav-desc">Writing about film, tech, and other things</span>
          </div>
          <ArrowRight className="home-nav-arrow" size={24} />
        </Link>
        <Link href="/film-listings" className="home-nav-link slide-in" style={{ animationDelay: '2.1s' }}>
          <div className="home-nav-content">
            <span className="home-nav-title">Film Listings</span>
            <span className="home-nav-desc">What's showing at independent cinemas in Amsterdam and Haarlem</span>
          </div>
          <ArrowRight className="home-nav-arrow" size={24} />
        </Link>
      </section>
    </Container>
  );
};

export default HomePage;
