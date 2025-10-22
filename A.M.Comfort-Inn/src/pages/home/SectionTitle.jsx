import React from 'react';

export const SectionTitle = ({ children }) => (
  <h2 className="text-center text-3xl md:text-4xl font-bold text-primary-blue mb-12 relative pb-4 font-playfair
                 after:content-[''] after:absolute after:bottom-0 after:left-1/2 
                 after:-translate-x-1/2 after:w-24 after:h-1 after:bg-orange-500"
  >
    {children}
  </h2>
);