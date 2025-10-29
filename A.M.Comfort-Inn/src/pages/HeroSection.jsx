import React, { useState, useEffect } from "react";

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
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
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
           Your Family's <br />
          Home Away From Home
        </h1>
        <img
          src="/A.M. Comfort Inn.png"
          alt="A.M. Comfort Inn Logo"
          className="h-40 rounded-lg transition-transform duration-300 hover:scale-105 shadow-2xl animate-fade-in-up mt-10"
          style={{ animationDelay: "0.6s" }} // Apply a delay to appear after the headline
        />
       
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-orange-500 scale-125" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
