import React, { useState, useEffect } from 'react';

export const HeroSection = ({ images }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000); // 5-second slide duration
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-[calc(100vh-80px)] mt-20 overflow-hidden">
      {/* Slides */}
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Ken Burns Effect Container */}
          <div 
            className="w-full h-full bg-cover bg-center animate-kenburns"
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      ))}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-center items-center text-center text-white p-5 gap-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-shadow-md animate-fade-in-up font-playfair">
          Your Family's Home<br />Away From Home
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl text-shadow-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          Crafted For Families, Designed For Comfort
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-orange-500 text-shadow-md animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          A.M. Comfort Inn
        </h2>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-orange-500 scale-125' : 'bg-white/50'}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};