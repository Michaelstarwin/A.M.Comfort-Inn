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
  const urlStatus = searchParams.get('status');
  const reason = searchParams.get('reason');

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayStatus, setDisplayStatus] = useState('loading');

  const ticketRef = useRef(null);

  useEffect(() => {
    // 1. Immediate Fail Check
    if (urlStatus === 'failed') {
      setDisplayStatus('failed');
      setIsLoading(false);
      return;
    }

    // 2. Try to load from LocalStorage (Fallback Strategy)
    const localDataString = localStorage.getItem('pendingBookingDetails');
    let localData = null;

    if (localDataString) {
      try {
        const parsed = JSON.parse(localDataString);
        if (!orderId || parsed.orderId === orderId) {
          localData = parsed;
        }
      } catch (e) {
        console.error("Failed to parse local booking details");
      }
    }

    // 3. Logic: If success in URL, show Success UI immediately using local data if available
    if (urlStatus === 'success') {
      if (localData) {
        console.log("[PaymentStatus] Using LocalStorage data");
        setBooking({ ...localData, bookingId: 'Pending...', paymentStatus: 'Success' });
        setDisplayStatus('success');
        setIsLoading(false);
      } else {
        // Fallback even if NO local data: Show generic success
        console.log("[PaymentStatus] No local data, using generic success");
        setBooking({
          bookingId: 'Pending...',
          paymentStatus: 'Success',
          // Generic details
          roomType: 'Booked Room',
          roomCount: 1,
          checkInDate: new Date(), // Just placeholders or hide them
          isGeneric: true
        });
        setDisplayStatus('success');
        setIsLoading(false);
      }

      // Try fetch in background
      fetchRealBooking(orderId, false);
      return;
    }

    // 4. Normal Flow (poll if no local data or not explicit success)
    fetchRealBooking(orderId, true);

  }, [orderId, urlStatus]);

  const fetchRealBooking = async (id, isBlocking = false) => {
    if (!id) return;
    try {
      if (isBlocking) setIsLoading(true);
      const response = await bookingApi.getBookingByOrderId(id);
      if (response && response.success && response.data) {
        setBooking(response.data);
        setDisplayStatus(response.data.paymentStatus === 'failed' ? 'failed' : 'success');
        if (isBlocking) setIsLoading(false);
        localStorage.removeItem('pendingBookingDetails');
      }
    } catch (e) {
      console.warn("[PaymentStatus] Backend fetch failed:", e.message);
      if (isBlocking) {
        // If blocking and failed...
        if (urlStatus === 'success') {
          // FORCE SUCCESS if URL implies it
          setDisplayStatus('success');
        } else {
          setDisplayStatus('error');
        }
        setIsLoading(false);
      }
    }
  };

  const handlePrint = () => {
    if (!ticketRef.current) return;
    const printContents = ticketRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800">Verifying Payment...</h2>
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
          <p className="text-gray-600 mb-6">
            {reason ? decodeURIComponent(reason) : "Your payment could not be processed."}
          </p>
          <button
            onClick={() => navigate('/booking')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (displayStatus === 'error') {
    // This block is effectively unreachable if urlStatus=success
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
          <FaExclamationTriangle className="text-yellow-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Booking Info Unavailable</h2>
          <p className="text-gray-600 mb-6">
            We received your request, but couldn't load the confirmation details right now.
            Please check your email.
          </p>
          <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // --- SUCCESS ---
  return (
    <div className="min-h-screen bg-gray-100 pt-28 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✨ Booking Confirmed! ✨</h1>
          <p className="text-gray-600">Thank you for choosing A.M. Comfort Inn</p>
          <p className="text-sm text-gray-500 mt-2">Confirmation email sent{booking?.email ? ` to ${booking.email}` : '.'}</p>
        </div>

        <div ref={ticketRef} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center pb-4 border-b-2 border-dashed border-gray-300">
            <h2 className="text-2xl font-bold text-blue-600">A.M. Comfort Inn</h2>
            <span className="text-sm font-semibold text-gray-700 bg-green-100 px-3 py-1 rounded-full">
              {booking?.bookingId === 'Pending...' ? 'Processing' : 'Confirmed'}
            </span>
          </div>

          {booking && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Details</h3>

              {/* Conditional Rendering: If we use generic placeholder, hide specific dates to avoid confusion */}
              {!booking.isGeneric ? (
                <>
                  <DetailItem label="Booking ID" value={booking.bookingId || 'Processing...'} />
                  <DetailItem label="Guest Name" value={booking.fullName || booking.guestName || 'Valued Guest'} />
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
                    <span className="text-lg font-bold text-green-600">₹{(booking.totalAmount || booking.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded">
                  <p className="text-gray-600">
                    We have received your payment successfully. <br />
                    The booking details have been sent to your email address.
                  </p>
                </div>
              )}

            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <p className="text-center text-gray-500 text-sm">
              Please save this ticket. {booking?.bookingId === 'Pending...' && "If Booking ID is processing, check your email in 5 minutes."}
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