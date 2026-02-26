'use client';

import { useState } from 'react';
import { Navbar, Container } from 'react-bootstrap';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import '../css/index.css';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar-container">
      <Container>
        <Navbar variant="dark" sticky="top">
          <Link className="navbar-brand" href="/">a-450</Link>
          <button
            className="header-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </Navbar>
      </Container>
      {menuOpen && (
        <div className="header-menu-dropdown">
          <Container>
            <Link
              className="header-menu-link"
              href="/blog"
              onClick={() => setMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              className="header-menu-link"
              href="/film-listings"
              onClick={() => setMenuOpen(false)}
            >
              Film Listings
            </Link>
            <div className="header-menu-divider" />
            <DarkModeToggle className="header-menu-link" />
          </Container>
        </div>
      )}
    </div>
  );
};

export default NavBar;
