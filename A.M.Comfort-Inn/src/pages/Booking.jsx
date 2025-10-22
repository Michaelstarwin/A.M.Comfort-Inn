import React, { useState } from "react";
import { bookingApi } from "../utils/api";
import { Toaster, toast } from "react-hot-toast";

import { AvailabilityStep } from "./Booking/AvailabilityStep";
import { GuestDetailsStep } from "./Booking/GuestDetails";
import { ReviewStep } from "./Booking/ReviewStep";

// Function to initialize Cashfree payment
// const initiateCashfreePayment = (orderData) => {
//   if (window.Cashfree) {
//     const cashfree = new window.Cashfree({
//       mode: "sandbox", // Change to "production" for live
//     });

//     cashfree.checkout({
//       paymentSessionId: orderData.payment_session_id, // Assuming backend provides this
//       redirectTarget: "_self", // Redirect in same tab
//     });
//   } else {
//     console.error("Cashfree SDK not loaded");
//     toast.error("Payment gateway not available. Please try again.");
//   }
// };

// Load Cashfree SDK
// const loadCashfreeSDK = () => {
//   if (!window.Cashfree) {
//     const script = document.createElement('script');
//     script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
//     script.async = true;
//     document.head.appendChild(script);
//   }
// };

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [guestData, setGuestData] = useState(null);

  // Load Cashfree SDK on component mount
  // React.useEffect(() => {
  //   loadCashfreeSDK();
  // }, []); // 1. Called when AvailabilityStep is successful

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
     // setIsLoading(false); // This is the data from your backend (orderId, signature, etc.)

      const { payment_session_id } = orderResponse.data;
      if (!window.Cashfree) {
          console.error("Cashfree SDK not loaded");
          toast.error("Payment gateway is not available. Please try again later.");
          setIsLoading(false);
          return;
        }

        const cashfree = new window.Cashfree({
          mode: "sandbox", // Change to "production" for live
        });

        toast.loading('Redirecting to payment...'); // Show loading toast *before* checkout

        cashfree.checkout({
          paymentSessionId: payment_session_id,
        }).then((result) => {
          // This .then() block runs *after* the popup closes or redirects
          toast.dismiss(); // Clear the loading toast
          setIsLoading(false); 
          
          if (result.error) {
            toast.error(result.error.message || "Payment failed.");
            console.error("Payment Error:", result.error);
            // Maybe reset to step 1 or allow retry?
            // setCurrentStep(1); 
          }
          if (result.redirect) {
            // Usually nothing needed here if relying on webhook + return_url
            console.log("Redirecting for bank authentication...");
          }
          if (result.paymentDetails) {
            // Optional: Show immediate feedback, but webhook is the source of truth
            console.log("Payment details received on client:", result.paymentDetails);
            toast.success("Payment submitted! Awaiting final confirmation.");
            // You might redirect based on your return_url here if needed,
            // but the PaymentStatus component needs rethinking (see point 2)
          }
        }).catch(err => {
            // Catch errors during the checkout initiation itself
            toast.dismiss();
            setIsLoading(false);
            console.error("Cashfree checkout initiation error:", err);
            toast.error("Could not start payment process. Please try again.");
        });
      // console.log("Proceed to payment with:", paymentData);
      // toast.success("Your order is ready. Redirecting to payment...");
      // initiateCashfreePayment(paymentData);
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
