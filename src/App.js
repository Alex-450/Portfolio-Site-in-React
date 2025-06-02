import React from 'react';
import NavBar from './Components/NavBar';
import Footer from './Components/Footer'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Col, Row, Nav } from 'react-bootstrap';
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
          <Nav className="d-flex justify-content-evenly">
              <Nav.Item>
                  <Nav.Link className="site-header-content-bottom" href="/about">Read more about me →</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                  <Nav.Link className="site-header-content-bottom" href="/blog">Read some stuff that I wrote →</Nav.Link>
              </Nav.Item>
          </Nav>
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
