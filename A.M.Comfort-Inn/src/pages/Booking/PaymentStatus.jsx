import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingApi } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FaPrint, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-200">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
  </div>
);

export const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(status || 'pending');
  const ticketRef = useRef(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!orderId) {
        setIsLoading(false);
        setPaymentStatus('error');
        toast.error('Booking reference not found.');
        return;
      }

      try {
        const response = await bookingApi.getBookingByOrderId(orderId);
        if (response.success && response.data) {
          setBooking(response.data);
          
          // If status from URL is success, show success message
          if (status === 'success') {
            setPaymentStatus('success');
            toast.success('✅ Payment successful! Your booking is confirmed.', {
              duration: 3000,
            });
          } else if (status === 'failed') {
            setPaymentStatus('failed');
            toast.error(`❌ Payment failed. ${reason || 'Please try again.'}`, {
              duration: 4000,
            });
          } else {
            // Check booking payment status from API
            const bookingStatus = response.data.paymentStatus?.toLowerCase();
            if (bookingStatus === 'success') {
              setPaymentStatus('success');
              toast.success('Booking confirmed!');
            } else if (bookingStatus === 'failed') {
              setPaymentStatus('failed');
              toast.error('Payment was not successful.');
            } else {
              setPaymentStatus('pending');
            }
          }
        } else {
          throw new Error(response.message || 'Failed to retrieve booking details.');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setPaymentStatus('error');
        toast.error(error.message || 'Could not find booking details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [orderId, status, reason]);

  const handlePrint = () => {
    const printContents = ticketRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Payment Failed State
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <FaTimesCircle className="text-red-500 text-6xl mb-4 mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold mb-4 text-red-700">Payment Failed</h2>
          <p className="text-gray-600 mb-2">
            Unfortunately, your payment could not be processed.
          </p>
          {reason && (
            <p className="text-sm text-gray-500 mb-6 italic">
              Reason: {decodeURIComponent(reason)}
            </p>
          )}
          <p className="text-gray-600 mb-6">
            Please try again or contact support if the problem persists.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/booking')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error State (no booking found)
  if (paymentStatus === 'error' || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find your booking details. Please check your email for confirmation or contact support.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/booking')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Make a New Booking
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Show Booking Confirmation
  return (
    <div className="min-h-screen bg-gray-100 pt-28 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✨ Booking Confirmed! ✨</h1>
          <p className="text-gray-600">Thank you for choosing A.M. Comfort Inn</p>
          <p className="text-sm text-gray-500 mt-2">A confirmation email has been sent to your inbox</p>
        </div>

        <div ref={ticketRef} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center pb-4 border-b-2 border-dashed border-gray-300">
            <h2 className="text-2xl font-bold text-blue-600">A.M. Comfort Inn</h2>
            <span className="text-sm font-semibold text-gray-700 bg-green-100 px-3 py-1 rounded-full">Confirmed</span>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Details</h3>
            <DetailItem label="Booking ID" value={booking.bookingId || 'N/A'} />
            <DetailItem 
              label="Check-in" 
              value={`${new Date(booking.checkInDate).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} @ ${booking.checkInTime || '12:00 PM'}`} 
            />
            <DetailItem 
              label="Check-out" 
              value={`${new Date(booking.checkOutDate).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} @ ${booking.checkOutTime || '11:00 AM'}`} 
            />
            <DetailItem label="Room Type" value={booking.roomType || 'N/A'} />
            <DetailItem label="Rooms Reserved" value={booking.roomCount || 1} />
            <div className="flex justify-between py-3 mt-2 bg-green-50 px-3 rounded-lg">
              <span className="text-lg font-bold text-gray-900">Total Amount Paid</span>
              <span className="text-lg font-bold text-green-600">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Guest Information</h3>
            <DetailItem label="Full Name" value={booking.guestInfo?.fullName || 'N/A'} />
            <DetailItem label="Email" value={booking.guestInfo?.email || 'N/A'} />
            <DetailItem label="Phone" value={booking.guestInfo?.phone || 'N/A'} />
          </div>
          
          <div className="mt-6 border-t pt-4 bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Important:</strong> Please arrive at the check-in time. For any queries or changes, 
              please contact us at <span className="font-semibold">booking.amcinn@gmail.com</span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition duration-300 shadow-md"
          >
            <FaPrint />
            Print Ticket
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};