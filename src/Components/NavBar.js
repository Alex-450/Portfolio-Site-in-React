import { Navbar, Container} from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import '../css/index.css';

const NavBar = () => (
  <div className="navbar-container">
    <Container>
      <Navbar className="navbar" variant="dark" sticky="top" expand="lg">
        <NavLink to="/" className="navbar-brand">a-450</NavLink>
      </Navbar>
    </Container>
  </div>
);

export default NavBar;
