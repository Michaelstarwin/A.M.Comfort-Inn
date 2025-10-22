import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// We no longer need to import './Gallery.css'

// --- Data for the gallery ---
const rooms = [
  {
    id: 1,
    name: 'Spacious Family Bedroom',
    description: 'A cozy room designed for restful nights and homely comfort.',
    image: '/Image1.jpeg'
  },
  {
    id: 2,
    name: 'Comfortable Stay',
    description: 'Bright and airy setup for a peaceful, private experience.',
    image: '/Image2.jpeg'
  },
  {
    id: 3,
    name: 'Neat Wardrobe Space',
    description: 'Organized interiors that make your family stay effortless.',
    image: '/Image3.jpeg'
  },
  {
    id: 4,
    name: 'Well-Equipped Dining Area',
    description: 'Enjoy family meals together in a clean and welcoming space.',
    image: '/Image4.jpeg'
  },
  {
    id: 5,
    name: 'Secure Entrance',
    description: 'Safe, gated entry providing complete peace of mind.',
    image: '/Image5.jpeg'
  },
  {
    id: 6,
    name: 'A.M. Comfort Inn — Front View',
    description: 'A modern, family-friendly inn built for relaxation.',
    image: '/Image6.jpeg'
  },
  {
    id: 7,
    name: 'Family Living Space',
    description: 'Relax and connect with loved ones in our cozy, well-furnished living area.',
    image: '/Image7.jpeg'
  },
  {
    id: 8,
    name: 'Neatly Arranged Bedroom',
    description: 'A clean and spacious bedroom designed for ultimate relaxation and rest.',
    image: '/Image8.jpeg'
  },
  {
    id: 9,
    name: 'Simple, Elegant Interiors',
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
    name: 'Bright Bedroom Ambience',
    description: 'Experience restful nights in our clean, air-conditioned room with natural lighting.',
    image: '/Image11.jpeg'
  },
  {
    id: 12,
    name: 'Cozy Living Area',
    description: 'Perfect for family chats, evening tea, or simply unwinding after a busy day.',
    image: '/Image12.jpeg'
  }
];

// --- Gallery Component ---
const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    // .gallery: pt-20 (to offset 80px navbar)
    <div className="gallery pt-20 bg-white">
      
      {/* Light & Clean Hero Section */}
      <div className="bg-white pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold text-primary-blue mb-4 animate-fade-in-up font-playfair">
          Our Rooms Gallery
        </h1>
        <p className="text-xl text-text-dark/90 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Explore our comfortable and stylish accommodations
        </p>
      </div>

      {/* .gallery-content */}
      <div className="py-16">
        {/* .container */}
        <div className="max-w-7xl mx-auto px-5">
          
          {/* .gallery-intro */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-primary-blue mb-6 pb-4 relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-24 after:h-1 after:bg-orange-500 font-playfair">
              Discover Your Perfect Stay
            </h2>
            <p className="text-lg text-text-dark/90 leading-relaxed">
              Each room is designed with comfort and luxury in mind, featuring modern amenities and elegant decor to make your stay unforgettable.
            </p>
          </div>

          {/* .gallery-grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {rooms.map((room, index) => (
              // .gallery-item (New Card-based design)
              <div
                key={room.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedImage(room)}
              >
                {/* .gallery-image */}
                <div className="h-72 overflow-hidden">
                  <img 
                    src={room.image} 
                    alt={room.name} 
                    loading="lazy" 
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110" 
                  />
                </div>
                {/* New Text Content Block */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary-blue mb-2 font-playfair truncate">{room.name}</h3>
                  <p className="text-text-dark/90 text-sm leading-relaxed">{room.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* .gallery-cta (New Light Version) */}
          <div className="text-center p-12 md:p-16 bg-gray-100 rounded-lg shadow-inner">
            <h2 className="text-4xl font-bold text-primary-blue mb-4 font-playfair">
              Ready to Book Your Stay?
            </h2>
            <p className="text-lg text-text-dark/90 mb-8 max-w-2xl mx-auto">
              Choose your perfect room and experience comfort like never before.
            </p>
            <Link 
              to="/booking" 
              className="bg-orange-500 text-white px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox (Modal) */}
      {selectedImage && (
        // .lightbox
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4 animate-fade-in" 
          onClick={() => setSelectedImage(null)}
        >
          {/* .lightbox-content */}
          <div 
            className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden animate-fade-in-up" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* .lightbox-close */}
            <button 
              className="absolute top-3 right-3 z-10 bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:bg-orange-600 hover:rotate-90" 
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
            
            <img 
              src={selectedImage.image} 
              alt={selectedImage.name} 
              className="w-full h-auto max-h-[70vh] object-cover" 
            />
            
            {/* .lightbox-info */}
            <div className="p-8">
              <h3 className="text-3xl font-bold text-primary-blue mb-3 font-playfair">
                {selectedImage.name}
              </h3>
              <p className="text-text-dark/90 text-lg mb-6 leading-relaxed">
                {selectedImage.description}
              </p>
              <Link 
                to="/booking" 
                className="bg-orange-500 text-white px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30"
              >
                Book This Room
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
