import { Navbar, Container, Col} from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import '../css/index.css';

const NavBar = () => (
  <div className="navbar-container">
    <Container>
      <Navbar className="navbar" variant="dark" sticky="top" expand="lg">
        <Col md={10}>
          <NavLink to="/" className="navbar-brand">a-450</NavLink>
        </Col>
        <Col>
        </Col>
      </Navbar>
    </Container>
  </div>
);

export default NavBar;
