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
  };

  const handleConfirmAndPay = async () => {
    setIsLoading(true);
    toast.loading("Preparing your booking...");

    try {
      if (!availabilityData || !guestData) {
        throw new Error("Missing booking information. Please fill in all required details.");
      }

      // ✅ NEW FLOW: Create order directly with full booking data (no pre-booking)
      const bookingRequest = {
        checkInDate: availabilityData.checkInDate,
        checkInTime: availabilityData.checkInTime,
        checkOutDate: availabilityData.checkOutDate,
        checkOutTime: availabilityData.checkOutTime,
        roomType: availabilityData.roomType,
        roomCount: availabilityData.roomCount,
        adultCount: availabilityData.adultCount,
        childCount: availabilityData.childCount,
        guestInfo: {
          fullName: guestData.fullName,
          email: guestData.email,
          phone: guestData.phone,
          country: guestData.country || "India",
        },
      };

      toast.dismiss();
      toast.loading("Generating payment order...");

      // Create order with full booking data
      const orderResponse = await bookingApi.createOrder(bookingRequest);
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || "Failed to create payment order.");
      }
      toast.dismiss();

      const { orderId, amount, currency } = orderResponse.data;

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK is not loaded. Please check your internet connection.");
      }

      const options = {
        key: "rzp_live_RgjfGSw269T1W4",
        amount: amount,
        currency: currency,
        name: "A.M. Comfort Inn",
        description: "Room Booking Payment",
        order_id: orderId,
        handler: async function (response) {
          console.log('[Razorpay] Full Response:', response);
          console.log('[Razorpay] Order ID:', response.razorpay_order_id);

          toast.loading("Verifying payment...");
          try {
            const verificationResponse = await bookingApi.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log('[Razorpay] Verification Response:', verificationResponse);
            toast.dismiss();

            if (verificationResponse.success) {
              toast.success("🎉 Payment Successful! Your booking is confirmed.");
              setIsLoading(false);

              // Use the EXACT orderId from response
              const orderIdToUse = response.razorpay_order_id;
              console.log(`[Razorpay] Redirecting with orderId: ${orderIdToUse}`);

              window.location.href = `/booking/payment-status?orderId=${orderIdToUse}&status=success`;
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.dismiss();
            toast.error("❌ Payment verification failed. Please contact support.");
            setIsLoading(false);
            navigate(`/booking/payment-status?orderId=${response.razorpay_order_id}&status=failed`);
          }
        },
        prefill: {
          name: guestData.fullName,
          email: guestData.email,
          contact: guestData.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            toast.dismiss();
            toast.error("Payment cancelled. You can try again when ready.");
            setIsLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.dismiss();
        toast.error(`❌ Payment Failed: ${response.error.description || "Please try again"}`, {
          duration: 5000,
        });
        setIsLoading(false);
        // Navigate to failure page
        setTimeout(() => {
          navigate(`/booking/payment-status?orderId=${orderId}&status=failed&reason=${encodeURIComponent(response.error.description || 'Unknown error')}`);
        }, 2000);
      });

      // Save booking details for fallback UI in PaymentStatus
      localStorage.setItem('pendingBookingDetails', JSON.stringify({
        ...availabilityData,
        ...guestData,
        orderId: orderId,
        amount: amount,
        timestamp: Date.now()
      }));

      razorpay.open();
      localStorage.setItem('lastBookingRef', JSON.stringify({ bookingId: orderId, timestamp: Date.now() }));
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
        return (
          <GuestDetailsStep
            onSuccess={handleGuestSuccess}
            onBack={() => setCurrentStep(1)}
            roomType={availabilityData?.roomType}
            roomCount={availabilityData?.roomCount}
          />
        );
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
