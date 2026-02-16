'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar, Container, Col } from 'react-bootstrap';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import '../css/index.css';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (for mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="navbar-container">
      <Container>
        <Navbar className="navbar" variant="dark" sticky="top" expand="lg">
          <Col md={10} className="header-menu-wrapper" ref={menuRef}>
            <span
              className="navbar-brand header-menu-trigger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              a-450
            </span>
            <div className={`header-menu-dropdown ${menuOpen ? 'menu-open' : ''}`}>
              <Link
                href="/"
                className="header-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                Blog ›
              </Link>
              <Link
                href="/film-listings"
                className="header-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                Film Listings ›
              </Link>
              <div className="header-menu-divider" />
              <DarkModeToggle />
            </div>
          </Col>
          <Col></Col>
        </Navbar>
      </Container>
    </div>
  );
};

export default NavBar;
