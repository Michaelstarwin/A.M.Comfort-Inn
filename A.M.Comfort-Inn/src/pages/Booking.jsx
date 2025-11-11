import React, { useState, useEffect } from "react";
import { bookingApi } from "../utils/api";
import { Toaster, toast } from "react-hot-toast";
import { config } from "../config/api.config";
import { loadScript } from "../utils/loadScript";

import { AvailabilityStep } from "./Booking/AvailabilityStep";
import { GuestDetailsStep } from "./Booking/GuestDetails";
import { ReviewStep } from "./Booking/ReviewStep";
import { useNavigate } from "react-router-dom";

const Booking = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [guestData, setGuestData] = useState(null);

  // Load Razorpay SDK on component mount
  useEffect(() => {
    const loadRazorpaySDK = async () => {
      try {
        const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!res) {
          toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        }
      } catch (err) {
        console.error('Failed to load Razorpay SDK:', err);
        toast.error('Payment system initialization failed. Please try again later.');
      }
    };

    loadRazorpaySDK();
  }, []);

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
      if (!availabilityData || !guestData) {
        throw new Error("Missing booking information. Please fill in all required details.");
      }

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
      };

      // Create the pending booking
      const preBookResponse = await bookingApi.preBook(preBookRequest);
      if (!preBookResponse.success) {
        throw new Error(
          preBookResponse.message || "Failed to create pending booking."
        );
      }
      const { bookingId } = preBookResponse.data;
      toast.success("Booking record created.");
      toast.loading("Generating Razorpay payment order...");

      // Create Razorpay order
      const orderResponse = await bookingApi.createOrder({ bookingId });
      if (!orderResponse.success) {
        throw new Error(
          orderResponse.message || "Failed to create payment order."
        );
      }
      toast.dismiss();

      const { orderId, amount, currency } = orderResponse.data;
      
      if (!window.Razorpay) {
          throw new Error("Razorpay SDK is not loaded. Please check your internet connection.");
      }

      const options = {
        key: config.RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: "A.M. Comfort Inn",
        description: "Room Booking Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            const verificationResponse = await bookingApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verificationResponse.success) {
              toast.success("Payment successful!");
              navigate(`/booking/status/${orderId}`);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: guestData.fullName,
          email: guestData.email,
          contact: guestData.phone
        },
        theme: {
          color: "#2563eb"
        }
      };

      try {
        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error);
          toast.error(response.error.description || "Payment failed");
          setIsLoading(false);
        });

        // Open Razorpay payment form
        razorpay.open();

        // Store booking reference
        localStorage.setItem('lastBookingRef', JSON.stringify({
          bookingId: orderId,
          timestamp: Date.now()
        }));

      } catch (error) {
        console.error("Payment processing error:", error);
        toast.dismiss();
        setIsLoading(false);
        throw error;
      }
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
