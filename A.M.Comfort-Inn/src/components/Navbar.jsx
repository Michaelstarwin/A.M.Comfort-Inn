import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
// We no longer import 'Navbar.css'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu automatically when the route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Helper function to determine if a link is active
  const isLinkActive = (path) => location.pathname === path;

  // Base classes for a navigation link
  const navLinkBaseClasses = "text-base font-medium relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-orange-500 after:transition-all after:duration-300";

  // Classes for an active link
  const navLinkActiveClasses = "text-orange-500 after:w-full";

  // Classes for an inactive link
  const navLinkInactiveClasses = "text-black after:w-0 hover:text-orange-500 hover:after:w-full";

  return (
    // .navbar: fixed, top-0, w-full, z-index, bg, padding
    <nav className="fixed top-0 left-0 w-full z-[1000] bg-primary-blue/95 py-4 shadow-lg bg-white">
      
      {/* .navbar-container: max-width, margin, padding, flex, justify, align */}
      <div className="max-w-7xl mx-auto px-5 flex justify-between items-center">
        
        {/* .navbar-logo & .logo-img */}
        <Link to="/" className="flex-shrink-0">
          <img
            src="/A.M. Comfort Inn.png"
            alt="A.M. Comfort Inn Logo"
            // h-12 is 48px (close to 50px), rounded-md, transitions
            className="h-12 rounded-md transition-transform duration-300 hover:scale-105"
          />
        </Link>

        {/* .mobile-menu-toggle: hidden on md screens and up, flex on mobile */}
        <button
          className="md:hidden flex flex-col p-1"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {/* Burger icon spans with 'X' animation */}
          <span className={`block w-6 h-0.5 bg-black rounded-sm transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-black rounded-sm transition-all duration-300 my-1 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-black rounded-sm transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>

        {/* .navbar-menu (Desktop): hidden on mobile, flex on md and up */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className={`${navLinkBaseClasses} ${isLinkActive('/') ? navLinkActiveClasses : navLinkInactiveClasses}`}
          >
            Home
          </Link>
          <Link 
            to="/gallery" 
            className={`${navLinkBaseClasses} ${isLinkActive('/gallery') ? navLinkActiveClasses : navLinkInactiveClasses}`}
          >
            Gallery
          </Link>
          
          {/* .navbar-btn */}
          <Link 
            to="/booking" 
            className="bg-orange-500 text-white px-6 py-2.5 rounded-md font-semibold transition-all duration-300 hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30"
          >
            Book Now
          </Link>
        </div>

        {/* .navbar-menu (Mobile): Shown only on md and down */}
        {/* Uses a translate transform for the slide-in/out animation */}
        <div 
          className={`md:hidden fixed top-[80px] w-full h-[calc(100vh-80px)] bg-primary-blue/98 flex bg-white flex-col items-center justify-center pt-12 gap-10 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'left-0' : '-left-full'}`}
        >
          <Link 
            to="/" 
            className={`text-2xl font-medium ${isLinkActive('/') ? 'text-orange-500' : 'text-black'}`}
          >
            Home
          </Link>
          <Link 
            to="/gallery" 
            className={`text-2xl font-medium ${isLinkActive('/gallery') ? 'text-orange-500' : 'text-black'}`}
          >
            Gallery
          </Link>
          
          {/* .navbar-btn (Mobile) */}
          <Link 
            to="/booking" 
            className="bg-orange-500 text-black px-8 py-3 rounded-md font-semibold text-xl"
          >
            Book Now
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
