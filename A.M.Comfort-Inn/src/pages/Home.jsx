import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Wind, Bed, ChefHat, Car, Droplets, Camera, Trash2, HeadphonesIcon, Phone, Tv, Star } from 'lucide-react';
import './Home.css';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    '/Image1.jpeg',
    '/Image3.jpeg',
    '/Image5.jpeg',
    '/Image10.jpeg'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const rooms = [
    {
      id: 1,
      name: 'Standard Family Room',
      image: '/Image5.jpeg',
      description: ' Ideal for small families or couples seeking a cozy, budget-friendly stay.',
      price: '₹3,500',
      amenities: ['Private Bedroom', 'Shared Hall & Kitchen', 'Air Conditioning', 'Free Wi-Fi', '24/7 Water Supply']
    },
    {
      id: 2,
      name: 'Family Suite (2 BHK)',
      image: '/Image1.jpeg',
      description: 'Spacious comfort for families who love privacy and togetherness.',
      price: '₹4,500',
      amenities: ['2 Bedrooms', 'Private Living Hall', 'Full Kitchen', 'Air Conditioning', 'Free Wi-Fi', 'Television']
    }
  ];

  const facilities = [
    { icon: Wifi, name: 'Free Wi-Fi' },
    { icon: Wind, name: 'Air Conditioning' },
    { icon: Bed, name: 'Clean & Comfortable Bedrooms (with linen & extra beds)' },
    { icon: ChefHat, name: 'Private / Shared Kitchen (as per unit)' },
    { icon: ChefHat, name: 'Full Kitchen with basic cookware' },
    { icon: Car, name: 'Onsite Parking' },
    { icon: Droplets, name: '24/7 Water Supply' },
    { icon: Camera, name: 'Safety & Security (CCTV)' },
    { icon: Trash2, name: 'Daily Cleaning' },
    { icon: HeadphonesIcon, name: '24/7 or Support' },
    { icon: Phone, name: 'Cab for Nearby Places' },
    { icon: Tv, name: 'In-room TV' }
  ];

  const beaches = [
    { name: 'Paradise Beach', image: '/Paradise Beach.jpeg' },
    { name: 'Serenity Beach', image: '/Serenity Beach.jpeg' },
    { name: 'Auro Beach (Auroville Beach)', image: '/Auro Beach (Auroville Beach).jpeg' },
    { name: 'Promenade Beach (Rock Beach)', image: '/Promenade Beach (Rock Beach).jpeg' }
  ];

  const museums = [
    { name: 'Pondicherry Museum', image: '/Pondicherry Museum.jpeg' },
    { name: 'Jawahar Toy Museum', image: '/Jawahar Toy Museum.jpeg' }
  ];

  const activities = [
    { name: 'Chunnambar Boat House', image: '/Chunnambar Boat House.jpeg' },
    { name: 'Sri Aurobindo Ashram', image: '/Sri Aurobindo Ashram.jpeg' },
    { name: 'Auroville', image: '/Auroville.jpeg' }
  ];

  const parksAndGardens = [
    { name: 'Bharathi Park', image: '/Bharathi Park.jpeg' },
    { name: 'Botanical Garden', image: '/Botanical Garden.jpeg' }
  ];

  const reviews = [
    {
      name: 'Rajesh Kumar',
      location: 'Chennai',
      rating: 5,
      text: 'We have experienced good comfort here like home'
    },
    {
      name: 'Priya Sharma',
      location: 'Bangalore',
      rating: 5,
      text: 'We have experienced good comfort here like home'
    },
    {
      name: 'Amit Patel',
      location: 'Mumbai',
      rating: 4,
      text: 'We have experienced good comfort here like home'
    }
  ];

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={18}
        fill={index < rating ? '#ffc107' : 'none'}
        stroke={index < rating ? '#ffc107' : '#ddd'}
      />
    ));
  };

  return (
    <div className="home">
      <section className="hero mt-50">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="hero-overlay"></div>
        <div className="hero-content animate-fade-in-up ">
          <h1 className="hero-title">Your family's Home </h1>
          <h1 className="hero-title1 ">Away From Home</h1>
          <p className="hero-description">Crafted For Families, Designed For Comfort</p>
          <h2 className="hero-subtitle">A.M. Comfort Inn</h2>
        </div>
        <div className="hero-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="rooms-section">
        <div className="container">
          <h2 className="section-title animate-fade-in-up">Our Family-Friendly Stays</h2>
          <div className="rooms-grid">
            {rooms.map((room, index) => (
              <div
                key={room.id}
                className="room-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="room-image">
                  <img src={room.image} alt={room.name} />
                </div>
                <div className="room-content">
                  <h3>{room.name}</h3>
                  <p className="room-description">{room.description}</p>
                  <div className="room-amenities">
                    {room.amenities.map((amenity, i) => (
                      <span key={i} className="amenity-badge">{amenity}</span>
                    ))}
                  </div>
                  <div className="room-footer">
                    <span className="room-price">{room.price}<span>/Day</span></span>
                    <Link to="/booking" className="btn-primary">Book Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="explore-rooms">
            <Link to="/gallery" className="btn-secondary">Explore Our Rooms</Link>
          </div>
        </div>
      </section>

      <section className="facilities-section">
        <div className="container">
          <h2 className="section-title">Our Facilities</h2>
          <div className="facilities-grid">
            {facilities.map((facility, index) => {
              const Icon = facility.icon;
              return (
                <div
                  key={index}
                  className="facility-item animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="facility-icon">
                    <Icon size={32} />
                  </div>
                  <p>{facility.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="tourist-spots-section">
        <div className="container">
          <h2 className="section-title">Explore Pondicherry</h2>

          <h3 className="section-subtitle" style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '30px' }}>Beaches</h3>
          <div className="tourist-grid">
            {beaches.map((spot, index) => (
              <div
                key={index}
                className="tourist-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="tourist-image">
                  <img src={spot.image} alt={spot.name} />
                  <div className="tourist-overlay">
                    <h3>{spot.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-subtitle" style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '30px', marginTop: '50px' }}>Museums</h3>
          <div className="tourist-grid">
            {museums.map((spot, index) => (
              <div
                key={index}
                className="tourist-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="tourist-image">
                  <img src={spot.image} alt={spot.name} />
                  <div className="tourist-overlay">
                    <h3>{spot.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-subtitle" style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '30px', marginTop: '50px' }}>Activities and Other Attractions</h3>
          <div className="tourist-grid">
            {activities.map((spot, index) => (
              <div
                key={index}
                className="tourist-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="tourist-image">
                  <img src={spot.image} alt={spot.name} />
                  <div className="tourist-overlay">
                    <h3>{spot.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-subtitle" style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--primary-blue)', marginBottom: '30px', marginTop: '50px' }}>Parks and Gardens</h3>
          <div className="tourist-grid">
            {parksAndGardens.map((spot, index) => (
              <div
                key={index}
                className="tourist-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="tourist-image">
                  <img src={spot.image} alt={spot.name} />
                  <div className="tourist-overlay">
                    <h3>{spot.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="container">
          <h2 className="section-title">What Our Guests Say</h2>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="review-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="review-stars">
                  {renderStars(review.rating)}
                </div>
                <p className="review-text">"{review.text}"</p>
                <div className="review-author">
                  <h4>{review.name}</h4>
                  <p>{review.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
