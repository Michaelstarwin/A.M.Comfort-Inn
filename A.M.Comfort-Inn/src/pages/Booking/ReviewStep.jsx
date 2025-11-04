import React from 'react';

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-200">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

export const ReviewStep = ({ availabilityData, guestData, onConfirm, onBack, isLoading }) => {
  if (!availabilityData || !guestData) {
    return (
      <div className="p-8 text-center">
        <p>Loading booking details...</p>
      </div>
    );
  }

  const handleConfirm = async () => {
    // In the background, submit the data to Web3Forms
    try {
      const web3formData = {
        access_key: '7b3b08f7-6d24-464a-9781-7fb7effb590e',
        subject: 'New Booking Confirmation from A.M. Comfort Inn',
        ...guestData,
        ...availabilityData,
      };

      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(web3formData),
      });
    } catch (error) {
      console.error('Failed to submit booking details to Web3Forms:', error);
    }

    // Proceed with the original confirmation logic
    onConfirm();
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 3: Review & Confirm</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Booking Summary</h3>
        <DetailItem label="Check-in" value={`${availabilityData.checkInDate} @ 12:00 PM`} />
        <DetailItem label="Check-out" value={`${availabilityData.checkOutDate} @ 11:00 PM`} />
        <DetailItem label="Room Type" value={availabilityData.roomType} />
        <DetailItem label="Rooms" value={availabilityData.roomCount} />
        <DetailItem label="Rate per Night" value={`₹${availabilityData.ratePerNight.toLocaleString()}`} />
        <div className="flex justify-between py-3 mt-2">
          <span className="text-lg font-bold text-gray-900">Total Amount</span>
          <span className="text-lg font-bold text-blue-600">₹{availabilityData.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Guest Information</h3>
        <DetailItem label="Full Name" value={guestData.fullName} />
        <DetailItem label="Email" value={guestData.email} />
        <DetailItem label="Phone" value={guestData.phone} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <button 
          onClick={onBack} 
          className="w-full bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
          disabled={isLoading}
        >
          Back
        </button>
        <button 
          onClick={handleConfirm} 
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </div>
    </div>
  );
};