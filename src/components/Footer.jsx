import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const facilities = [
    'Free Wi-Fi',
    'Air Conditioning',
    'Clean Bedrooms',
    'Kitchens',
    'Parking',
    '24/7 Water Supply',
    'CCTV Security',
    'Daily Cleaning',
    '24/7 Support',
    'Cab Service',
    'In-room TV'
  ];

  const touristSpots = [
    'Paradise Beach',
    'Promenade Beach',
    'Auroville',
    'Botanical Garden',
    'French Quarter',
    'Pondicherry Museum',
    'Scuba Diving',
    'Serenity Beach'
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-logo">
            <img
              src="/A.M. Comfort Inn.png"
              alt="A.M. Comfort Inn"
            />
          </div>
          <p className="footer-tagline">Your Family's Home Away From Home</p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/booking">Book Now</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Facilities</h3>
          <ul>
            {facilities.slice(0, 6).map((facility, index) => (
              <li key={index}>{facility}</li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3>Tourist Spots</h3>
          <ul>
            {touristSpots.slice(0, 6).map((spot, index) => (
              <li key={index}>{spot}</li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul>
            <li>Location: 33/A, Asirvatha Street, Balaji Naggar (Near Trinity Church), Reddiyarpalayam, Puducherry - 605 010.</li>
            <li>Phone: +91 86109 95376 / 77082 17974</li>
            <li>Email: booking.amcinn@gmail.com</li>
            <li>24/7 Support Available</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>&copy; 2025 A.M. Comfort Inn. All Rights Reserved.</p>
          <p>
            Design and Developed by{' '}
            <a
              href="https://boldvizbyte.com"
              target="_blank"
              rel="noopener noreferrer"
              className="developer-link"
            >
              BoldVizByte
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
