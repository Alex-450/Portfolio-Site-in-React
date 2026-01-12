import { Navbar, Container, Col } from 'react-bootstrap';
import Link from 'next/link';
import '../css/index.css';

const NavBar = () => (
  <div className="navbar-container">
    <Container>
      <Navbar className="navbar" variant="dark" sticky="top" expand="lg">
        <Col md={10}>
          <Link href="/" className="navbar-brand">
            a-450
          </Link>
        </Col>
        <Col></Col>
      </Navbar>
    </Container>
  </div>
);

export default NavBar;
