import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Gallery.css';

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const rooms = [
    {
      id: 1,
      name: 'Spacious Family Bedroom',
      description: 'A cozy room designed for restful nights and homely comfort.',
      image: '/Image1.jpeg'
    },
    {
      id: 2,
      name: 'Comfortable Stay for Every Guest',
      description: 'Bright and airy setup for a peaceful, private experience.',
      image: 'Image2.jpeg'
    },
    {
      id: 3,
      name: 'Neat Wardrobe & Functional Space',
      description: 'Organized interiors that make your family stay effortless.',
      image: '/Image3.jpeg'
    },
    {
      id: 4,
      name: 'Well-Equipped Dining & Kitchen Area',
      description: 'Enjoy family meals together in a clean and welcoming space.',
      image: '/Image4.jpeg'
    },
    {
      id: 5,
      name: 'Secure Entrance & Parking Access',
      description: 'Safe, gated entry providing complete peace of mind.',
      image: '/Image5.jpeg'
    },
    {
      id: 6,
      name: 'A.M. Comfort Inn — Front View',
      description: 'A modern, family-friendly inn built for relaxation and convenience.',
      image: '/Image6.jpeg'
    },
    {
      id: 7,
      name: 'Comfortable Family Living Space',
      description: 'Relax and connect with loved ones in our cozy, well-furnished living area.',
      image: '/Image7.jpeg'
    },
    {
      id: 8,
      name: 'Neatly Arranged Bedroom for a Peaceful Stay',
      description: 'A clean and spacious bedroom designed for ultimate relaxation and rest.',
      image: '/Image8.jpeg'
    },
    {
      id: 9,
      name: 'Simple, Elegant Interiors for a Homely Feel',
      description: 'Thoughtfully arranged furniture and decor to make you feel right at home.',
      image: '/Image9.jpeg'
    },
    {
      id: 10,
      name: 'Safe & Welcoming Entrance',
      description: 'Secure entryway ensuring safety and privacy for every guest.',
      image: '/Image10.jpeg'
    },
    {
      id: 11,
      name: ' Bright Bedroom with a Calm Ambience',
      description: 'Experience restful nights in our clean, air-conditioned room with natural lighting.',
      image: '/Image11.jpeg'
    },
    {
      id: 12,
      name: 'Cozy Living Area with a Relaxing Vibe',
      description: 'Perfect for family chats, evening tea, or simply unwinding after a busy day.',
      image: '/Image12.jpeg'
    }
  ];

  return (
    <div className="gallery">
      <div className="gallery-hero">
        <div className="gallery-hero-overlay"></div>
        <div className="gallery-hero-content">
          <h1 className="animate-fade-in-up">Our Rooms Gallery</h1>
          <p className="animate-fade-in-up">Explore our comfortable and stylish accommodations</p>
        </div>
      </div>

      <div className="gallery-content">
        <div className="container">
          <div className="gallery-intro animate-fade-in-up">
            <h2>Discover Your Perfect Stay</h2>
            <p>Each room is designed with comfort and luxury in mind, featuring modern amenities and elegant decor to make your stay unforgettable.</p>
          </div>

          <div className="gallery-grid">
            {rooms.map((room, index) => (
              <div
                key={room.id}
                className="gallery-item animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedImage(room)}
              >
                <div className="gallery-image">
                  <img src={room.image} alt={room.name} loading="lazy" />
                  <div className="gallery-overlay">
                    <h3>{room.name}</h3>
                    <p>{room.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="gallery-cta">
            <h2>Ready to Book Your Stay?</h2>
            <p>Choose your perfect room and experience comfort like never before</p>
            <Link to="/booking" className="btn-primary">Book Now</Link>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
              &times;
            </button>
            <img src={selectedImage.image} alt={selectedImage.name} />
            <div className="lightbox-info">
              <h3>{selectedImage.name}</h3>
              <p>{selectedImage.description}</p>
              <Link to="/booking" className="btn-primary">Book This Room</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
