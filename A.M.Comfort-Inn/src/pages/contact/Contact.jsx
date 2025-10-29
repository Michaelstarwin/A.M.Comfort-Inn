import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react'; // Example icons from lucide-react (or use your preferred icon library)

const Contact = () => {
  // Simple component for animated sections
  const AnimatedSection = ({ children, delay }) => (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );

  return (
    <section className="min-h-screen bg-gray-50 py-16">
      {/* Background Image/Hero Section */}
      <div className="relative h-96 w-full overflow-hidden mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out animate-zoom-in"
          style={{ backgroundImage: 'url(/A.M. Comfort Inn.png)' }} // **CRITICAL: Replace with a high-quality, professional image**
        >
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* Animated Headline */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
          <AnimatedSection delay={100}>
            <h1 className="text-5xl md:text-7xl font-playfair font-bold tracking-wide text-shadow-lg">
              Get In Touch
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p className="mt-4 text-xl font-light">
              We're here to help you plan your perfect stay.
            </p>
          </AnimatedSection>
        </div>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* --- Contact Details Section --- */}
        <div className="lg:col-span-1 space-y-8">
          <AnimatedSection delay={500}>
            <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-orange-500 pb-2 mb-6">
              Connect With Us
            </h2>
          </AnimatedSection>

          {/* Individual Contact Cards */}
          <AnimatedSection delay={700}>
            <ContactCard
              icon={Phone}
              title="Call Us"
              detail="+1 (555) 123-4567"
              description="Mon - Sun: 9:00 AM to 6:00 PM"
            />
          </AnimatedSection>

          <AnimatedSection delay={900}>
            <ContactCard
              icon={Mail}
              title="Email Us"
              detail="booking.amcinn@gmail.com"
              description="We typically reply within 24 hours."
            />
          </AnimatedSection>

          <AnimatedSection delay={1100}>
            <ContactCard
              icon={MapPin}
              title="Visit Our Location"
              detail="123 Serenity Drive, Coastal Town, 90210"
              description="Near the Lighthouse Beach."
            />
          </AnimatedSection>

          <AnimatedSection delay={1300}>
            <ContactCard
              icon={Clock}
              title="Office Hours"
              detail="Reservations Team"
              description="24/7 online booking available."
            />
          </AnimatedSection>
        </div>

        {/* --- Contact Form Section --- */}
        <div className="lg:col-span-2">
          <AnimatedSection delay={500}>
            <div className="p-8 md:p-10 bg-white rounded-xl shadow-2xl hover:shadow-3xl transition-shadow duration-300 border border-gray-100">
              <h2 className="text-3xl font-bold text-orange-500 mb-6">
                Request a Reservation or Inquiry
              </h2>
              <p className="mb-8 text-gray-600">
                Please provide your details and desired dates, and our team will confirm availability.
              </p>
              <form className="space-y-6">
                
                {/* 1. Personal Contact Fields */}
                <h3 className="text-xl font-semibold text-gray-800 pt-2 border-t border-gray-100">Your Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="Full Name" type="text" id="name" placeholder="John Doe" />
                  <FormInput label="Email Address" type="email" id="email" placeholder="you@example.com" />
                  <FormInput label="Phone Number" type="tel" id="phone" placeholder="(555) 123-4567" />
                </div>
                
                {/* 2. Booking Details Fields */}
                <h3 className="text-xl font-semibold text-gray-800 pt-4 border-t border-gray-100">Reservation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Check-in Date */}
                  <FormInput label="Check-in Date" type="date" id="checkin" />
                  
                  {/* Check-out Date */}
                  <FormInput label="Check-out Date" type="date" id="checkout" />

                  {/* Number of Guests */}
                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Guests
                    </label>
                    <input
                      type="number"
                      id="guests"
                      min="1"
                      defaultValue="1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* 3. Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message / Special Requests
                  </label>
                  <textarea
                    id="message"
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 shadow-inner"
                    placeholder="E.g., Require a crib, booking 2 separate rooms, late arrival, etc."
                  ></textarea>
                </div>
                
                <AnimatedSection delay={1500}>
                    <button
                    type="submit"
                    className="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-300 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-orange-500/50"
                    >
                    Submit Reservation Request
                    </button>
                </AnimatedSection>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

// Helper component for the contact detail cards
const ContactCard = ({ icon, title, detail, description }) => (
  <div className="flex items-start p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-orange-500">
    {React.createElement(icon, { className: "w-8 h-8 text-orange-500 mt-1 flex-shrink-0" })}
    <div className="ml-4">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-lg font-bold text-gray-700 mt-1">{detail}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

// Helper component for form input fields
const FormInput = ({ label, type, id, placeholder }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        <input
            type={type}
            id={id}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 shadow-inner"
            placeholder={placeholder}
            required
        />
    </div>
);


export default Contact;