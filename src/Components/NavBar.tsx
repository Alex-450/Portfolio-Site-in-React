'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar, Container, Col } from 'react-bootstrap';
import Link from 'next/link';
import DarkModeToggle from './DarkModeToggle';
import '../css/index.css';

const NavBar = () => {
  return (
    <div className="navbar-container">
      <Container>
        <Navbar className="navbar" variant="dark" sticky="top">
          <Col md={10} className="header-menu-wrapper">
            <span
              className="navbar-brand header-menu-trigger"
            >
              a-450
            </span>
            <div
              className="header-menu-dropdown"
            >
              <Link
                href="/"
                className="header-menu-link"
              >
                Blog ›
              </Link>
              <Link
                href="/film-listings"
                className="header-menu-link"
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
