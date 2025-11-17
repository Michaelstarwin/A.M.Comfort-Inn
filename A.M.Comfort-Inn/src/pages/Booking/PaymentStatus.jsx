import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FaPrint, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-200">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
  </div>
);

export const PaymentStatus = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const ticketRef = useRef(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!orderId) {
        setIsLoading(false);
        setIsError(true);
        toast.error('Booking reference not found.');
        return;
      }

      try {
        const response = await bookingApi.getBookingByOrderId(orderId);
        if (response.success && response.data) {
          setBooking(response.data);
          if (response.data.paymentStatus === 'SUCCESS') {
            toast.success('Thank you for your payment! Your booking is confirmed.');
          } else {
            setIsError(true);
            toast.error('Payment was not successful. Please try again.');
          }
        } else {
          throw new Error(response.message || 'Failed to retrieve booking details.');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setIsError(true);
        toast.error(error.message || 'Could not find booking details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
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
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (isError || !booking || booking.paymentStatus !== 'SUCCESS') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
          <FaTimesCircle className="text-red-500 text-6xl mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4 text-red-700">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            There was an issue with your payment. Please try again or contact support if the problem persists.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/booking')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
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
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-28 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-800">Booking Confirmed!</h1>
          <p className="text-gray-600">Your ticket is ready to be viewed or printed.</p>
        </div>

        <div ref={ticketRef} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center pb-4 border-b-2 border-dashed">
            <h2 className="text-2xl font-bold text-blue-600">A.M. Comfort Inn</h2>
            <span className="text-sm font-semibold text-gray-700">Booking Ticket</span>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Details</h3>
            <DetailItem label="Booking ID" value={booking.bookingId} />
            <DetailItem label="Check-in" value={`${new Date(booking.checkInDate).toLocaleDateString()} @ 12:00 PM`} />
            <DetailItem label="Check-out" value={`${new Date(booking.checkOutDate).toLocaleDateString()} @ 11:00 AM`} />
            <DetailItem label="Room Type" value={booking.room.roomType} />
            <DetailItem label="Rooms Reserved" value={booking.roomCount} />
            <div className="flex justify-between py-3 mt-2">
              <span className="text-lg font-bold text-gray-900">Total Amount Paid</span>
              <span className="text-lg font-bold text-blue-600">₹{booking.transaction.amount.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Guest Information</h3>
            <DetailItem label="Full Name" value={booking.guest.fullName} />
            <DetailItem label="Email" value={booking.guest.email} />
            <DetailItem label="Phone" value={booking.guest.phone} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition duration-300"
          >
            <FaPrint />
            Print Ticket
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};