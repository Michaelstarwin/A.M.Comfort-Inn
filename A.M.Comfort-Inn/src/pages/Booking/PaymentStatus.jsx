import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingApi } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FaPrint, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';

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

  // Optimistic status from URL (set by Razorpay redirect)
  const urlStatus = searchParams.get('status');
  const reason = searchParams.get('reason');

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Internal state to track what we display. 
  // If urlStatus is 'success', start with 'verifying' instead of generic loading.
  const [displayStatus, setDisplayStatus] = useState(
    urlStatus === 'failed' ? 'failed' :
      urlStatus === 'success' ? 'verifying' : 'loading'
  );

  const ticketRef = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 10; // Stop after ~20-30 seconds

  useEffect(() => {
    let isMounted = true;
    let pollTimeout;

    // 1. Immediate Failure Handling
    if (urlStatus === 'failed') {
      console.log('[PaymentStatus] URL indicates failure. Showing failed screen immediately.');
      setDisplayStatus('failed');
      setIsLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      if (!orderId) {
        if (isMounted) {
          setIsLoading(false);
          setDisplayStatus('error');
          toast.error('Order ID not found in URL.');
        }
        return true; // Stop polling
      }

      try {
        console.log(`[PaymentStatus] 🔍 Fetching booking for orderId: ${orderId} (Attempt ${retryCount.current + 1}/${MAX_RETRIES})`);

        const response = await bookingApi.getBookingByOrderId(orderId);

        if (!isMounted) return true;

        if (response && response.success && response.data) {
          const bookingData = response.data;
          const bookingStatus = bookingData.paymentStatus?.toLowerCase();

          console.log(`[PaymentStatus] ✅ Booking found! DB Status: ${bookingStatus}`);

          if (bookingStatus === 'success' || bookingStatus === 'confirmed') {
            setBooking(bookingData);
            setDisplayStatus('success');
            setIsLoading(false);
            toast.success('✅ Payment verified successfully!');
            return true; // Stop polling
          }

          if (bookingStatus === 'failed') {
            setBooking(bookingData);
            setDisplayStatus('failed');
            setIsLoading(false);
            toast.error('❌ Payment failed.');
            return true; // Stop polling
          }

          // If status is still pending/created in DB, keep polling
          console.log(`[PaymentStatus] ⏳ DB status is ${bookingStatus}, continuing to poll...`);
        }
      } catch (error) {
        console.warn(`[PaymentStatus] Attempt ${retryCount.current + 1} failed:`, error.message);
      }

      // Retry Logic
      retryCount.current += 1;

      if (retryCount.current >= MAX_RETRIES) {
        if (isMounted) {
          setIsLoading(false);
          // If we had a success signal from URL but backend didn't confirm in time,
          // Show "Processing" state instead of "Error"
          if (urlStatus === 'success') {
            setDisplayStatus('processing');
          } else {
            setDisplayStatus('timeout');
          }
        }
        return true; // Stop polling
      }

      return false; // Continue polling
    };

    const runPolling = async () => {
      const shouldStop = await fetchBookingDetails();
      if (!shouldStop) {
        // Exponential-ish backoff: 2s, 2s, 3s, 3s, 5s...
        const delay = retryCount.current < 5 ? 2000 : 4000;
        pollTimeout = setTimeout(runPolling, delay);
      }
    };

    runPolling();

    return () => {
      isMounted = false;
      clearTimeout(pollTimeout);
    };
  }, [orderId, urlStatus]);

  const handlePrint = () => {
    if (!ticketRef.current) return;
    const printContents = ticketRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // --- RENDER STATES ---

  if (isLoading || displayStatus === 'loading' || displayStatus === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {displayStatus === 'verifying' ? 'Verifying Payment...' : 'Loading Booking Details...'}
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Please wait while we confirm your booking with the payment gateway. Do not close this window.
          </p>
        </div>
      </div>
    );
  }

  if (displayStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <FaTimesCircle className="text-red-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4 text-red-700">Payment Failed</h2>
          <p className="text-gray-600 mb-2">
            Unfortunately, your payment could not be processed.
          </p>
          {reason && (
            <p className="text-sm text-gray-500 mb-6 italic bg-gray-100 p-2 rounded">
              Reason: {decodeURIComponent(reason)}
            </p>
          )}
          <button
            onClick={() => navigate('/booking')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Graceful Timeout / Processing State
  if (displayStatus === 'processing' || displayStatus === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <FaClock className="text-orange-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Processing Payment</h2>
          <p className="text-gray-600 mb-6">
            We received your payment signal, but your booking is still being finalized in our system.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
              <li>Do not pay again.</li>
              <li>Check your email inbox for the booking confirmation (it may take a few minutes).</li>
              <li>Contact support if you don't receive it within 10 minutes.</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (displayStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't retrieve your booking details.
          </p>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // --- SUCCESS STATE ---
  return (
    <div className="min-h-screen bg-gray-100 pt-28 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✨ Booking Confirmed! ✨</h1>
          <p className="text-gray-600">Thank you for choosing A.M. Comfort Inn</p>
          <p className="text-sm text-gray-500 mt-2">Confirmation email has been sent.</p>
        </div>

        <div ref={ticketRef} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center pb-4 border-b-2 border-dashed border-gray-300">
            <h2 className="text-2xl font-bold text-blue-600">A.M. Comfort Inn</h2>
            <span className="text-sm font-semibold text-gray-700 bg-green-100 px-3 py-1 rounded-full">Confirmed</span>
          </div>

          {booking && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Details</h3>
              <DetailItem label="Booking ID" value={booking.bookingId || 'N/A'} />
              <DetailItem
                label="Check-in"
                value={booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'}
              />
              <DetailItem
                label="Check-out"
                value={booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}
              />
              <DetailItem label="Room Type" value={booking.roomType || 'N/A'} />
              <DetailItem label="Rooms" value={booking.roomCount || 1} />

              <div className="flex justify-between py-3 mt-4 bg-green-50 px-3 rounded-lg border border-green-100">
                <span className="text-lg font-bold text-gray-900">Total Paid</span>
                <span className="text-lg font-bold text-green-600">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <p className="text-center text-gray-500 text-sm">
              Please save this ticket or check your email for details.
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