import React from 'react';
import { Star } from 'lucide-react';

const renderStars = (rating) => (
  <div className="flex gap-1 text-yellow-400">
    {Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={18}
        fill={index < rating ? 'currentColor' : 'none'}
        stroke={index < rating ? 'currentColor' : '#ddd'}
      />
    ))}
  </div>
);

export const ReviewCard = ({ review, delay }) => (
  <div 
    className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 animate-fade-in-up"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="mb-4">
      {renderStars(review.rating)}
    </div>
    <p className="text-text-dark/90 italic text-lg mb-5">
      "{review.text}"
    </p>
    <div className="border-t pt-4">
      <h4 className="text-primary-blue font-bold text-lg">{review.name}</h4>
      <p className="text-text-dark/70 text-sm">{review.location}</p>
    </div>
  </div>
);