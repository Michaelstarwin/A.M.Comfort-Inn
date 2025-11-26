import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// We no longer need to import './Gallery.css'

// --- Data for the gallery ---
const rooms = [
  {
    id: 1,
    name: 'Elegant Living Space',
    description: 'A cozy and stylish living room featuring a soft wooden sofa set, modern decor, and warm lighting that creates a welcoming home atmosphere.',
    image: '/Image1.jpeg'
  },
  {
    id: 2,
    name: 'Comfortable Bedroom',
    description: 'A neatly arranged bedroom with a double bed, premium bedding, and calm tones designed for peaceful relaxation.',
    image: '/Image2.jpeg'
  },
  {
    id: 3,
    name: 'Modern Hall Design',
    description: 'A bright and open hall with simple furniture, clean walls, and perfect lighting for family gatherings or leisure time.',
    image: '/Image3.jpeg'
  },
  {
    id: 4,
    name: 'House Front Entrance',
    description: 'A secure and well-maintained house entrance with tiled flooring and a grill gate that offers safety and style.',
    image: '/Image4.jpeg'
  },
  {
    id: 5,
    name: 'Air-Conditioned Bedroom',
    description: 'A cozy, cool bedroom with an air conditioner, wooden wardrobe, and minimalist design for a refreshing stay.',
    image: '/Image5.jpeg'
  },
  {
    id: 6,
    name: 'Minimalist Lounge Area',
    description: 'A small yet elegant lounge space designed for comfort and simplicity, suitable for both guests and family moments.',
    image: '/Image6.jpeg'
  },
  {
    id: 7,
    name: 'Neat Living Area',
    description: 'A simple and functional living space with a comfortable sofa set and decorative curtains that enhance the room’s elegance.',
    image: '/Image7.jpeg'
  },
  {
    id: 8,
    name: 'Elegant Bedroom Interior',
    description: 'A well-decorated bedroom that combines comfort and simplicity with neatly arranged furniture and soothing colors.',
    image: '/Image8.jpeg'
  },
  {
    id: 9,
    name: 'Elegant & Simple Interiors',
    description: 'Our rooms feature thoughtfully arranged furniture and decor. We strive to make you feel right at home from the moment you arrive.',
    image: '/Image9.jpeg'
  },
  {
    id: 10,
    name: 'Family Dining Space',
    description: 'A well-organized dining corner featuring wooden furniture and a peaceful setting for everyday meals.',
    image: '/Image10.jpeg'
  },
  {
    id: 11,
    name: 'Secure Front Gate Area',
    description: 'A neat and tiled front space featuring a strong metal gate and a clean pink wall finish, providing both safety and elegance for the entrance.',
    image: '/Image11.jpeg'
  },
  {
    id: 12,
    name: 'Modern Two-Storey House Front',
    description: 'A beautifully maintained two-floor residence painted in soft pink and white tones, featuring a gated parking area and balcony with decorative railings — perfect for family living.',
    image: '/Image12.jpeg'
  }
];

// --- Gallery Component ---
const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    // .gallery: pt-20 (to offset 80px navbar)
    <div className="gallery pt-20 bg-white">

      {/* .gallery-content */}
      <div className="py-16">
        {/* .container */}
        <div className="max-w-7xl mx-auto px-5">
          
          {/* .gallery-intro */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
            <h2 className="text-6xl font-bold text-primary-blue mb-6 pb-4 relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-24 after:h-1 after:bg-orange-500 font-playfair">
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
