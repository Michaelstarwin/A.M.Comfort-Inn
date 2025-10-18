import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className={`navbar`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img
            src="/A.M. Comfort Inn.png"
            alt="A.M. Comfort Inn Logo"
            className="logo-img"
          />
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/gallery" className={`navbar-link ${location.pathname === '/gallery' ? 'active' : ''}`}>
            Gallery
          </Link>
          <Link to="/booking" className="navbar-btn">
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
