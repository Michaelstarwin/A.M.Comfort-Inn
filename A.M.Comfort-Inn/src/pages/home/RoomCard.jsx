import React from 'react';
import { Link } from 'react-router-dom';

export const RoomCard = ({ room, delay }) => (
  <div 
    className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="h-64 overflow-hidden">
      <img 
        src={room.image} 
        alt={room.name} 
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
      />
    </div>
    <div className="p-6">
      <h3 className="text-2xl font-bold text-primary-blue mb-3 font-playfair">{room.name}</h3>
      <p className="text-text-dark/90 mb-4 min-h-[40px]">{room.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-5">
        {room.amenities.map((amenity, i) => (
          <span key={i} className="bg-primary-blue/10 text-primary-blue text-xs font-semibold px-3 py-1 rounded-full">
            {amenity}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center border-t pt-4">
        <span className="text-2xl font-bold text-orange-500">
          {room.price}
          <span className="text-sm font-normal text-text-dark/80">/Day</span>
        </span>
        <Link 
          to="/booking" 
          className="bg-orange-500 text-white px-6 py-2.5 rounded-md font-semibold transition-all duration-300 hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30"
        >
          Book Now
        </Link>
      </div>
    </div>
  </div>
);