import React from 'react';
import { Wifi, Wind, Bed, ChefHat, Car, Droplets, Camera, Trash2, HeadphonesIcon, Phone, Tv, Star, CardSim } from 'lucide-react';
// We no longer import Home.css

// Import your new, smaller components
import { HeroSection } from './HeroSection';
import { SectionTitle } from './home/SectionTitle';
import { RoomCard } from './home/RoomCard';
import { FacilityCard } from './home/FacilityCard';
import { ExploreCard } from './home/ExploreCard';
import { ReviewCard } from './home/ReviewCard';
import { Link } from 'react-router-dom';

// --- All your data definitions remain the same ---
const heroImages = [
  '/Image1.jpeg', '/Image3.jpeg', '/Image5.jpeg', '/Image10.jpeg'
];

const rooms = [
  {
    id: 1,
    name: 'Standard Room',
    image: '/Image5.jpeg',
    description: 'Comfortable and affordable room perfect for couples or small families.',
    price: '₹1,800',
    amenities: ['Private Bedroom', 'Air Conditioning', 'Free Wi-Fi', 'Attached Bathroom']
  },
  {
    id: 2,
    name: 'Deluxe Room',
    image: '/Image1.jpeg',
    description: 'Spacious and luxurious room with premium amenities for a memorable stay.',
    price: '₹2,500',
    amenities: ['King Size Bed', 'Private Balcony', 'Air Conditioning', 'Free Wi-Fi', 'Mini Fridge', '2 Double Bedroom', "Full kitchen",'Covered Car Parking']
  }
];

const facilities = [
  { icon: Wifi, name: 'Free Wi-Fi' },
  { icon: Wind, name: 'Air Conditioning' },
  { icon: Bed, name: 'Clean Bedrooms' },
  { icon: ChefHat, name: 'Full Kitchen' },
  { icon: Car, name: 'Onsite Parking' },
  { icon: Droplets, name: '24/7 Water Supply' },
  { icon: Camera, name: 'CCTV Security' },
  { icon: Trash2, name: 'Daily Cleaning' },
  { icon: HeadphonesIcon, name: '24/7 Support' },
  { icon: Phone, name: 'Cab Service' },
  { icon: Tv, name: 'In-room TV' },
  { icon: Car, name: 'Covered Car Parking' }
];

// SIMPLIFIED: All tourist spots in one array
const touristSpots = [
  { name: 'Paradise Beach', image: '/Paradise Beach.jpeg' },
  { name: 'Serenity Beach', image: '/Serenity Beach.jpeg' },
  { name: 'Auroville', image: '/Auroville.jpeg' },
  { name: 'Promenade Beach', image: '/Promenade Beach (Rock Beach).jpeg' },
  { name: 'Pondicherry Museum', image: '/Pondicherry Museum.jpeg' },
  { name: 'Chunnambar Boat House', image: '/Chunnambar Boat House.jpeg' },
  { name: 'Sri Aurobindo Ashram', image: '/Sri Aurobindo Ashram.jpeg' },
  { name: 'Botanical Garden', image: '/Botanical Garden.jpeg' }
];

const reviews = [
  { name: 'Rajesh Kumar', location: 'Chennai', rating: 5, text: 'We have experienced good comfort here like home' },
  { name: 'Priya Sharma', location: 'Bangalore', rating: 5, text: 'We have experienced good comfort here like home' },
  { name: 'Amit Patel', location: 'Mumbai', rating: 4, text: 'We have experienced good comfort here like home' }
];
// --- End of data definitions ---


const Home = () => {
  return (
    // Use the font from your config
    <div className="home font-playfair">
      
      {/* Hero Section */}
      <HeroSection images={heroImages} />

      {/* Rooms Section */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="max-w-7xl mx-auto px-5">
          <SectionTitle>Our Rooms</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {rooms.map((room, index) => (
              <RoomCard 
                key={room.id} 
                room={room} 
                delay={index * 0.1} 
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/gallery" className="bg-primary-blue text-black hover:text-white px-8 py-3 rounded-md font-semibold text-lg transition-all duration-300 border-2 border-blue-900 hover:bg-blue-900 hover:-translate-y-0.5 hover:shadow-lg">
              Explore All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <SectionTitle>Our Facilities</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {facilities.map((facility, index) => (
              <FacilityCard 
                key={index} 
                icon={facility.icon} 
                name={facility.name} 
                delay={index * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Explore Section (Replaces all 4 tourist sections) */}
      <section className="py-16 md:py-24 bg-gray-100">
        <div className="max-w-7xl mx-auto px-5">
          <SectionTitle>Explore Pondicherry</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {touristSpots.map((spot, index) => (
              <ExploreCard 
                key={index} 
                spot={spot} 
                delay={index * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <SectionTitle>What Our Guests Say</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <ReviewCard 
                key={index} 
                review={review} 
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;