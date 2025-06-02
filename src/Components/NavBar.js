import { Nav, Navbar, Container} from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import '../css/index.css';

const NavBar = () => (
    <div className="navbar-container">
        <Container>
            <Navbar className="navbar" variant="dark" sticky="top" expand="lg">
                 <NavLink to="/" className="navbar-brand">Alex Stearn</NavLink>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse>
                    <Nav className="navbar">
                            <NavLink className="navbar-link" activeClassName="navbar-link-active" to="/" exact={true}>Home</NavLink>
                            <NavLink className="navbar-link" activeClassName="navbar-link-active" to="/about">About</NavLink>
                            <NavLink className="navbar-link" activeClassName="navbar-link-active" to="/blog">Blog</NavLink>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </Container>
    </div>
    );

export default NavBar;
