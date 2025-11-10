import React from 'react';

// eslint-disable-next-line no-unused-vars
export const FacilityCard = ({ icon: Icon, name, delay }) => (
  <div 
    className="flex flex-col items-center text-center p-4 bg-gray-100 rounded-xl transition-all duration-300 ease-in-out hover:bg-primary-blue hover:text-white hover:-translate-y-1.5 hover:shadow-xl group animate-fade-in-up"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="p-4 bg-white rounded-full mb-3 text-orange-500 transition-all duration-300 group-hover:bg-white/20 group-hover:text-orange">
      <Icon size={28} />
    </div>
    <p className="text-sm font-semibold text-text-dark group-hover:text-black flex-grow">{name}</p>
  </div>
);