import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const useSubmit = () => {
  const [state, setState] = React.useState({
    submitting: false,
    success: false,
    error: false,
  });

  const handleSubmit = async (data) => {
    setState({ submitting: true, success: false, error: false });
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setState({ submitting: false, success: true, error: false });
      } else {
        setState({ submitting: false, success: false, error: true });
      }
    } catch (error) {
      setState({ submitting: false, success: false, error: true });
    }
  };

  return [state, handleSubmit];
};

const Contact = () => {
  const { register, handleSubmit: handleFormSubmit, reset } = useForm();
  const [submissionState, handleWeb3Submit] = useSubmit();

  const onSubmit = async (data) => {
    await handleWeb3Submit(data);
    toast.promise(
      Promise.resolve(submissionState),
      {
        loading: 'Submitting...',
        success: () => {
          reset();
          return 'Form submitted successfully!';
        },
        error: 'Failed to submit the form.',
      }
    );
  };

  return (
    <section className="min-h-screen bg-gray-50 py-16">
      <div className="relative h-96 w-full overflow-hidden mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out animate-zoom-in"
          style={{ backgroundImage: 'url(/Image5.jpeg)' }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
          <h1 className="text-5xl md:text-7xl font-playfair font-bold tracking-wide text-shadow-lg">
            Get In Touch
          </h1>
          <p className="mt-4 text-xl font-light">
            We're here to help you plan your perfect stay.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-orange-500 pb-2 mb-6">
            Connect With Us
          </h2>
          <ContactCard
            icon={Phone}
            title="Call Us"
            detail="+91 86109 95376"
            description="Mon - Sun: 9:00 AM to 6:00 PM"
          />
          <ContactCard
            icon={Mail}
            title="Email Us"
            detail="booking.amcinn@gmail.com"
            description="We typically reply within 24 hours."
          />
          <ContactCard
            icon={MapPin}
            title="Visit Our Location"
            detail="33/A, Asirvatha Street, Balaji Naggar, Reddiyarpalayam, Puducherry - 605 010."
            description="Near Trinity Church"
          />
          <ContactCard
            icon={Clock}
            title="Office Hours"
            detail="Reservations Team"
            description="24/7 online booking available."
          />
        </div>

        <div className="lg:col-span-2">
          <div className="p-8 md:p-10 bg-white rounded-xl shadow-2xl hover:shadow-3xl transition-shadow duration-300 border border-gray-100">
            <h2 className="text-3xl font-bold text-orange-500 mb-6">
              Request a Reservation or Inquiry
            </h2>
            <p className="mb-8 text-gray-600">
              Please provide your details and desired dates, and our team will confirm availability.
            </p>
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" name="access_key" value="7b3b08f7-6d24-464a-9781-7fb7effb590e" {...register('access_key')} />
              <h3 className="text-xl font-semibold text-gray-800 pt-2 border-t border-gray-100">Your Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInput label="Full Name" type="text" id="fullName" name="fullName" placeholder="John Doe" register={register} />
                <FormInput label="Email Address" type="email" id="email" name="email" placeholder="you@example.com" register={register} />
                <FormInput label="Phone Number" type="tel" id="phone" name="phone" placeholder="(555) 123-4567" register={register} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 pt-4 border-t border-gray-100">Reservation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInput label="Check-in Date" type="date" id="checkin" name="checkin" register={register} />
                <FormInput label="Check-out Date" type="date" id="checkout" name="checkout" register={register} />
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                  <input type="number" id="guests" min="1" defaultValue="1" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 shadow-inner" required {...register('guests')} />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message / Special Requests</label>
                <textarea id="message" rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 shadow-inner" placeholder="E.g., Require a crib, booking 2 separate rooms, late arrival, etc." {...register('message')}></textarea>
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-300 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-orange-500/50" disabled={submissionState.submitting}>
                {submissionState.submitting ? 'Submitting...' : 'Submit Reservation Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactCard = ({ icon, title, detail, description }) => (
  <div className="flex items-start p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-orange-500">
    {React.createElement(icon, { className: 'w-8 h-8 text-orange-500 mt-1 flex-shrink-0' })}
    <div className="ml-4">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-lg font-bold text-gray-700 mt-1">{detail}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const FormInput = ({ label, type, id, name, placeholder, register }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} id={id} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 shadow-inner" placeholder={placeholder} required {...register(name)} />
  </div>
);

export default Contact;