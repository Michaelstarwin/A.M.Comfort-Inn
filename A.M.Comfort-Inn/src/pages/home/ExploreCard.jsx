import React from 'react';

export const ExploreCard = ({ spot, delay }) => (
  <div 
    className="rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up group"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="relative h-72 overflow-hidden">
      <img 
        src={spot.image} 
        alt={spot.name} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <h3 className="absolute bottom-4 left-4 text-white text-xl font-bold text-shadow-md">
        {spot.name}
      </h3>
    </div>
  </div>
);