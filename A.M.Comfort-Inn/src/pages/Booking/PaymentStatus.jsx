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
    let isMounted = true;
    let pollInterval;
    let timeoutTimer;

    const fetchBookingDetails = async () => {
      if (!orderId) {
        if (isMounted) {
          setIsLoading(false);
          setPaymentStatus('error');
          toast.error('Booking reference not found.');
        }
        return;
      }

      try {
        console.log(`[PaymentStatus] Polling booking for orderId: ${orderId}`);
        const response = await bookingApi.getBookingByOrderId(orderId);

        if (!isMounted) return;

        if (response && response.success && response.data) {
          const bookingData = response.data;
          const bookingStatus = bookingData.paymentStatus?.toLowerCase();

          console.log('[PaymentStatus] Status:', bookingStatus);

          if (bookingStatus === 'success' || bookingStatus === 'confirmed') {
            setBooking(bookingData);
            setPaymentStatus('success');
            setIsLoading(false);
            toast.success('✅ Payment successful! Your booking is confirmed.');
            return true; // Stop polling
          } else if (bookingStatus === 'failed') {
            setBooking(bookingData);
            setPaymentStatus('failed');
            setIsLoading(false);
            toast.error('❌ Payment failed.');
            return true; // Stop polling
          }
          // If pending, continue polling
        }
      } catch (error) {
        console.error('[PaymentStatus] Error polling:', error);
        // Don't stop polling on transient errors, just log
      }
      return false; // Continue polling
    };

    const startPolling = async () => {
      // Initial check
      const done = await fetchBookingDetails();
      if (done) return;

      // Poll every 2 seconds
      pollInterval = setInterval(async () => {
        const stop = await fetchBookingDetails();
        if (stop) {
          clearInterval(pollInterval);
          clearTimeout(timeoutTimer);
        }
      }, 2000);

      // Stop after 15 seconds
      timeoutTimer = setTimeout(() => {
        if (isMounted && isLoading) {
          clearInterval(pollInterval);
          setIsLoading(false);
          setPaymentStatus('timeout'); // You might want to handle this state specifically or show 'pending' with a message
          toast('Payment verification timed out. Please check your email.', { icon: '⚠️' });
        }
      }, 15000);
    };

    startPolling();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
    };
  }, [orderId]);

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
  const roomInventory = booking?.roomInventory;
  const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://a-m-comfort-inn.onrender.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
            <FaCheckCircle className="text-green-600 text-6xl animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✨ Booking Confirmed! ✨</h1>
          <p className="text-gray-600 text-lg">Thank you for choosing A.M. Comfort Inn</p>
          <p className="text-sm text-gray-500 mt-2">A confirmation email has been sent to {booking.guestInfo?.email}</p>
        </div>

        {/* Booking Receipt Card */}
        <div ref={ticketRef} className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">A.M. Comfort Inn</h2>
                <p className="text-blue-100 text-sm mt-1">Your Digital Booking Receipt</p>
              </div>
              <div className="bg-green-400 text-green-900 px-4 py-2 rounded-full text-sm font-bold shadow-md">
                ✓ CONFIRMED
              </div>
            </div>
          </div>

          {/* Room Image & Details */}
          {roomInventory?.imageUrl && (
            <div className="relative h-64 overflow-hidden">
              <img 
                src={`${backendUrl}${roomInventory.imageUrl}`}
                alt={roomInventory.roomType || 'Room'}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-2xl font-bold">{roomInventory.roomType}</h3>
                {roomInventory.description && (
                  <p className="text-white/90 text-sm mt-1">{roomInventory.description}</p>
                )}
              </div>
            </div>
          )}

          <div className="p-8">
            {/* Booking Reference */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
              <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
              <p className="text-xl font-bold text-gray-900">{booking.bookingId}</p>
              {booking.paymentOrderId && (
                <p className="text-xs text-gray-500 mt-1">Order ID: {booking.paymentOrderId}</p>
              )}
            </div>

            {/* Stay Details */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">📅</span> Stay Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.checkInDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{booking.checkInTime || '12:00 PM'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.checkOutDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{booking.checkOutTime || '11:00 AM'}</p>
                </div>
              </div>
            </div>

            {/* Room & Pricing Details */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">🏨</span> Room Details
              </h3>
              <DetailItem label="Room Type" value={roomInventory?.roomType || booking.roomType || 'N/A'} />
              <DetailItem label="Number of Rooms" value={booking.roomCount || 1} />
              {roomInventory?.currentRate && (
                <DetailItem 
                  label="Rate per Night" 
                  value={`₹${roomInventory.currentRate.toLocaleString('en-IN')}`} 
                />
              )}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount Paid</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                {booking.paymentId && (
                  <p className="text-xs text-gray-500 mt-2">Payment ID: {booking.paymentId}</p>
                )}
              </div>
            </div>

            {/* Guest Information */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-blue-600">👤</span> Guest Information
              </h3>
              <DetailItem label="Full Name" value={booking.guestInfo?.fullName || 'N/A'} />
              <DetailItem label="Email" value={booking.guestInfo?.email || 'N/A'} />
              <DetailItem label="Phone" value={booking.guestInfo?.phone || 'N/A'} />
              {booking.guestInfo?.country && (
                <DetailItem label="Country" value={booking.guestInfo.country} />
              )}
            </div>

            {/* Important Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-l-4 border-blue-600">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-xl">ℹ️</span> Important Information
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Please arrive at the specified check-in time</li>
                <li>• Carry a valid government-issued ID for verification</li>
                <li>• For any queries or changes, contact us at <span className="font-semibold text-blue-600">booking.amcinn@gmail.com</span></li>
                <li>• Check-out time is {booking.checkOutTime || '11:00 AM'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold py-4 px-6 rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <FaPrint className="text-lg" />
            Print Receipt
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Back to Home
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          We look forward to welcoming you! 🎉
        </p>
      </div>
    </div>
  );
};