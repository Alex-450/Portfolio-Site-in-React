'use client';

import { Navbar, Container } from 'react-bootstrap';
import Link from 'next/link';
import '../css/index.css';

const NavBar = () => {
  return (
    <div className="navbar-container">
      <Container>
        <Navbar  variant="dark" sticky="top">
          <Link className="navbar-brand" href="/" >a-450</Link>
          <Link className="nav-link" href="/film-listings">
            Film Listings
          </Link>
        </Navbar>
      </Container>
    </div>
  );
};

export default NavBar;
