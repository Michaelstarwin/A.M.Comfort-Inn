import React, { useState } from "react";
import { bookingApi } from "../utils/api";
import { Toaster, toast } from "react-hot-toast";

import { AvailabilityStep } from "./Booking/AvailabilityStep";
import { GuestDetailsStep } from "./Booking/GuestDetails";
import { ReviewStep } from "./Booking/ReviewStep";

// This is where you would load the Cashfree SDK
// const loadCashfree = (orderData) => {
//  console.log("Loading Cashfree with:", orderData);
//  // const cashfree = new Cashfree(orderData.signature);
// // cashfree.initialise(orderData.orderId);
//  // cashfree.processPayment();
//  toast.success('Redirecting to payment gateway!');
// };

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [guestData, setGuestData] = useState(null); // 1. Called when AvailabilityStep is successful

  const handleAvailabilitySuccess = (data) => {
    setAvailabilityData(data);
    setCurrentStep(2);
    toast.success(data.message);
  }; // 2. Called when GuestDetailsStep is successful

  const handleGuestSuccess = (data) => {
    setGuestData(data);
    setCurrentStep(3);
  }; // 3. Called from ReviewStep to initiate the full booking and payment

  const handleConfirmAndPay = async () => {
    setIsLoading(true);
    toast.loading("Creating your booking...");

    try {
      // Combine data from all steps for the preBook call
      const preBookRequest = {
        checkInDate: availabilityData.checkInDate,
        checkInTime: availabilityData.checkInTime,
        checkOutDate: availabilityData.checkOutDate,
        checkOutTime: availabilityData.checkOutTime,
        roomType: availabilityData.roomType,
        roomCount: availabilityData.roomCount,
        guestInfo: {
          fullName: guestData.fullName,
          email: guestData.email,
          phone: guestData.phone,
          country: guestData.country || "India",
        },
      }; // FR 3.2: Create the 'Pending' booking

      const preBookResponse = await bookingApi.preBook(preBookRequest);
      if (!preBookResponse.success) {
        throw new Error(
          preBookResponse.message || "Failed to create pending booking."
        );
      }
      const { bookingId } = preBookResponse.data;
      toast.success("Booking record created.");
      toast.loading("Generating payment order..."); // FR 3.3: Create the Cashfree order

      const orderResponse = await bookingApi.createOrder({ bookingId });
      if (!orderResponse.success) {
        throw new Error(
          orderResponse.message || "Failed to create payment order."
        );
      }
      toast.dismiss(); // Clear all loading toasts
      setIsLoading(false); // This is the data from your backend (orderId, signature, etc.)

      const paymentData = orderResponse.data; // TODO: Pass paymentData to the Cashfree SDK loader // loadCashfree(paymentData);
      console.log("Proceed to payment with:", paymentData);
      toast.success("Your order is ready. Redirecting to payment..."); // For demo: reset after 3 seconds
      setTimeout(() => {
        setCurrentStep(1);
        setAvailabilityData(null);
        setGuestData(null);
      }, 3000);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "An unknown error occurred.");
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AvailabilityStep onSuccess={handleAvailabilitySuccess} />;
      case 2:
        return <GuestDetailsStep onSuccess={handleGuestSuccess} />;
      case 3:
        return (
          <ReviewStep
            availabilityData={availabilityData}
            guestData={guestData}
            onConfirm={handleConfirmAndPay}
            onBack={() => setCurrentStep(2)}
            isLoading={isLoading}
          />
        );
      default:
        return <AvailabilityStep onSuccess={handleAvailabilitySuccess} />;
    }
  };

  return (
    // Add pt-20 (80px) to offset the fixed navbar
    <div className="booking bg-gray-50 min-h-screen pt-20">
     <Toaster position="top-right" />
      {/* NEW: Clean heading section */}
      <div className="container mx-auto pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary-blue mb-4 font-playfair animate-fade-in-up">
          Book Your Stay
        </h1>
        <p
          className="text-lg md:text-xl text-text-dark/90 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          Reserve your perfect room at A.M. Comfort Inn
        </p>
      </div>
      <div className="booking-content container mx-auto px-4 pb-16 md:pb-24">

        <div
          className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
{renderStep()}
        </div>

      </div>
    </div>
  );
};

export default Booking;
