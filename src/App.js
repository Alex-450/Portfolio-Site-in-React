import React from 'react';
import NavBar from './Components/NavBar';
import Footer from './Components/Footer'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Col, Row } from 'react-bootstrap';
import './css/App.css'

class App extends React.Component {
  render() {
  return (
    <div>
      <NavBar />
      <Container>
        <Row>
          <Col xs={{span: 6, offset: 1}} md={4} className="site-header-content">
            <p>My name is Alex.</p>
          </Col>
        </Row>
        <Row>
          <Col xs={{span: 6, offset: 2}} md={{span: 4, offset: 3}} className="site-header-content">
            <p>I studied History and German.</p>
            </Col>
        </Row>
        <Row>
          <Col xs={{span: 6, offset: 3}} md={{ span: 4, offset: 4 }} className="site-header-content">
            <p>I did some teaching.</p>
          </Col>
        </Row>
        <Row>
          <Col xs={{span: 6, offset: 4}} md={{ span: 4, offset: 5 }} className="site-header-content">
            <p>I worked in a load of bars and restaurants.</p>
          </Col>
        </Row>
        <Row>
          <Col xs={{span: 6, offset: 2}} md={{ span: 4, offset: 3 }} className="site-header-content">
            <p>Now I test apps and stuff.</p>
          </Col>
        </Row>
      </Container>
      <Container>
          <hr></hr>
      </Container>
      <Container>
        <Row>
          <Col xs={{span: 6, offset: 3}} md={{span: 2, offset: 1}} className="site-header-content-bottom">
            <a href="/about" id="homepage-nav" className="stretched-link">Read more about me →</a>
          </Col>
          <Col xs={{span: 6, offset: 3}} md={{span: 2, offset: 2}} className="site-header-content-bottom">
            <a href="/blog" id="homepage-nav" className="stretched-link">Read some stuff that I wrote →</a>
          </Col>
          <Col xs={{span: 6, offset: 3}} md={{span: 2, offset: 2}} className="site-header-content-bottom">
            <a href="/contact" id="homepage-nav" className="stretched-link">Get in touch! →</a>
          </Col>
        </Row>
      </Container>
      <Container>
        <hr></hr>
      </Container>
      <Footer />
    </div>
  );
}
}

export default App;
