import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Processing your payment...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Get parameters from Cashfree redirect URL
    const orderId = searchParams.get('order_id');

    if (orderId) {
      // Check booking status by making an API call to get the booking details
      // For now, we'll show a generic success message since webhook handles the actual confirmation
      setMessage('Thank you for your payment! Your booking is being processed and you will receive a confirmation email shortly.');
      setIsError(false);
    } else {
      setMessage('There was an issue processing your payment return status.');
      setIsError(true);
    }
  }, [searchParams]);

  // ... (rest of the component to display message and buttons)

  return (
     <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
       <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
         {isError ? (
           <div className="text-red-500 text-6xl mb-4">✗</div>
         ) : (
           <div className="text-green-500 text-6xl mb-4">✓</div> // Or a processing spinner initially
         )}
         <h2 className={`text-2xl font-bold mb-4 ${isError ? 'text-red-700' : 'text-gray-800'}`}>
           {isError ? 'Payment Issue' : 'Payment Submitted'}
         </h2>
         <p className="text-gray-600 mb-6">{message}</p>
         {/* Buttons to navigate away */}
          <div className="space-y-4">
            {isError && (
              <button
                onClick={() => navigate('/booking')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
            <button
               onClick={() => navigate('/')}
               className="w-full bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
             >
               Back to Home
            </button>
         </div>
       </div>
     </div>
  );
};