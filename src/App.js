import NavBar from './Components/NavBar';
import Footer from './Components/Footer'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Col, Row } from 'react-bootstrap';
import './css/App.css'

const App = () => {
  return (
    <div>
      <NavBar />
      <Container>
        <Row className="slide-in">
          <Col xs={{span: 6, offset: 1}} md={4} className="site-header-content">
            <p>My name is Alex.</p>
          </Col>
        </Row>
        <Row className="slide-in" style={{ animationDelay: '0.1s' }}>
          <Col xs={{span: 6, offset: 2}} md={{span: 4, offset: 3}} className="site-header-content">
            <p>I studied History and German.</p>
            </Col>
        </Row>
        <Row className="slide-in" style={{ animationDelay: '0.2s' }}>
          <Col xs={{span: 6, offset: 3}} md={{ span: 4, offset: 4 }} className="site-header-content">
            <p>I did some teaching.</p>
          </Col>
        </Row>
        <Row className="slide-in" style={{ animationDelay: '0.3s' }}>
          <Col xs={{span: 6, offset: 4}} md={{ span: 4, offset: 5 }} className="site-header-content">
            <p>I worked in a load of bars and restaurants.</p>
          </Col>
        </Row>
        <Row className="slide-in" style={{ animationDelay: '0.4s' }}>
          <Col xs={{span: 6, offset: 2}} md={{ span: 4, offset: 3 }} className="site-header-content">
            <p>Now I'm a software developer.</p>
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

export default App;
