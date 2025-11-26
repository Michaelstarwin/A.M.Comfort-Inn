import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const facilities = [
    'Free Wi-Fi', 'Air Conditioning', 'Clean Bedrooms',
    'Kitchens', 'Parking', '24/7 Water Supply',
  ];

  const touristSpots = [
    'Paradise Beach', 'Promenade Beach', 'Auroville',
    'Botanical Garden', 'French Quarter', 'Pondicherry Museum',
  ];

  const FooterLink = ({ to, children }) => (
    <li className="transition-transform duration-300 ease-in-out hover:translate-x-1.5">
      <Link 
        to={to} 
        className="text-sm text-slate-300 transition-colors duration-300 hover:text-orange-400"
      >
        {children}
      </Link>
    </li>
  );
  
  const FooterListItem = ({ children }) => (
    <li className="text-sm text-slate-300 transition-transform duration-300 ease-in-out hover:text-orange-400 hover:translate-x-1.5 cursor-default">
      {children}
    </li>
  );

  return (
    <footer className="bg-slate-800 text-slate-300 pt-16 mt-20">
      
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-10">
        
        <div className="col-span-2 sm:col-span-1">
          <img
            src="/A.M. Comfort Inn.png"
            alt="A.M. Comfort Inn"
            className="h-14 w-auto mb-4 rounded-md"
          />
          <p className="text-sm leading-relaxed">
            Your Family's Home Away From Home
          </p>
        </div>

        <div>
          <FooterH3>Quick Links</FooterH3>
          <ul className="space-y-3">
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/gallery">Gallery</FooterLink>
            <FooterLink to="/booking">Book Now</FooterLink>
          </ul>
        </div>

        <div>
          <FooterH3>Facilities</FooterH3>
          <ul className="space-y-3">
            {facilities.map((facility, index) => (
              <FooterListItem key={index}>{facility}</FooterListItem>
            ))}
          </ul>
        </div>

        <div>
          <FooterH3>Tourist Spots</FooterH3>
          <ul className="space-y-3">
            {touristSpots.map((spot, index) => (
              <FooterListItem key={index}>{spot}</FooterListItem>
            ))}
          </ul>
        </div>

        <div className="col-span-2 lg:col-span-1">
          <FooterH3>Contact Us</FooterH3>
          <ul className="space-y-3">
            <li className="text-sm leading-relaxed">
              33/A, Asirvatha Street, Balaji Naggar (Near Trinity Church), Reddiyarpalayam, Puducherry - 605 010.
            </li>
            <li className="text-sm">+91 86109 95376</li>
            <li className="text-sm">booking.amcinn@gmail.com</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-900 py-5 text-center">
        <div className="max-w-7xl mx-auto px-5 md:flex md:justify-between md:items-center">
          <p className="text-sm text-slate-400 my-1.5 md:my-0">
            &copy; 2025 A.M. Comfort Inn. All Rights Reserved.
          </p>
          <p className="text-sm text-slate-400 my-1.5 md:my-0">
            Design and Developed by{' '}
            <a
              href="https://boldvizbyte.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 font-bold italic transition-all duration-300 relative
                         after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-0 after:h-0.5 
                         after:bg-orange-400 after:transition-[width] after:duration-300
                         hover:text-orange-400 hover:after:w-full hover:[text-shadow:0_0_10px_rgba(0,212,255,0.5)]"
            >
              BoldVizByte
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterH3 = ({ children }) => (
  <h3 className="text-xl font-bold text-white mb-5 pb-2.5 relative 
                 after:content-[''] after:absolute after:bottom-0 after:left-0 
                 after:w-[50px] after:h-[3px] after:bg-orange-500"
  >
    {children}
  </h3>
);

export default Footer;