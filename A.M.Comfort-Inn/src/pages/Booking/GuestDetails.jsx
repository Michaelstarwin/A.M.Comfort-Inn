import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema for validation
const guestSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  country: z.string().optional(),
  adultCount: z.number().min(1, 'At least 1 adult is required'),
  childCount: z.number().min(0),
});

// Reusable Form Input Component
const FormInput = ({ label, name, type, register, error }) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      type={type}
      {...register(name)}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
  </div>
);

// Stepper Component for Count Inputs
const StepperInput = ({ label, value, onIncrement, onDecrement, minDisabled, maxDisabled }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="flex items-center space-x-3">
      <button
        type="button"
        onClick={onDecrement}
        disabled={minDisabled}
        className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg font-bold transition-colors
          ${minDisabled ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 bg-white'}`}
      >
        -
      </button>
      <span className="text-lg font-semibold w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={maxDisabled}
        className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg font-bold transition-colors
          ${maxDisabled ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500 bg-white'}`}
      >
        +
      </button>
    </div>
  </div>
);

export const GuestDetailsStep = ({ onSuccess, roomCount = 1, roomType }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      country: 'India',
      adultCount: 2,
      childCount: 2
    }
  });

  const adultCount = watch('adultCount');
  const childCount = watch('childCount');

  // Set default values based on roomCount on mount or change
  useEffect(() => {
    if (roomCount === 1) {
      setValue('adultCount', 2);
      setValue('childCount', 2);
    } else if (roomCount === 2) {
      setValue('adultCount', 4);
      setValue('childCount', 4);
    }
  }, [roomCount, setValue]);

  // Occupancy Logic
  const totalGuests = adultCount + childCount;
  const maxGuests = 5 * roomCount;
  const maxAdults = 3 * roomCount;

  // Button Disable Logic
  const isAdultMaxReached = adultCount >= maxAdults || totalGuests >= maxGuests;
  const isChildMaxReached = totalGuests >= maxGuests;
  const isAdultMinReached = adultCount <= 1;
  const isChildMinReached = childCount <= 0;

  const handleIncrementAdult = () => {
    if (!isAdultMaxReached) setValue('adultCount', adultCount + 1);
  };

  const handleDecrementAdult = () => {
    if (!isAdultMinReached) setValue('adultCount', adultCount - 1);
  };

  const handleIncrementChild = () => {
    if (!isChildMaxReached) setValue('childCount', childCount + 1);
  };

  const handleDecrementChild = () => {
    if (!isChildMinReached) setValue('childCount', childCount - 1);
  };

  const onSubmit = (data) => {
    onSuccess(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 2: Guest Details</h2>

      {/* Room Info Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800 font-medium">
          Booking for: {roomCount} {roomType || 'Room'}{roomCount > 1 ? 's' : ''}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Max occupancy: {maxGuests} guests ({maxAdults} adults max)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FormInput label="Full Name" name="fullName" type="text" register={register} error={errors.fullName} />
        <FormInput label="Email Address" name="email" type="email" register={register} error={errors.email} />
        <FormInput label="Phone Number" name="phone" type="tel" register={register} error={errors.phone} />
        <FormInput label="Country" name="country" type="text" register={register} error={errors.country} />

        {/* Guest Counts */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <StepperInput
            label="Adults"
            value={adultCount}
            onIncrement={handleIncrementAdult}
            onDecrement={handleDecrementAdult}
            minDisabled={isAdultMinReached}
            maxDisabled={isAdultMaxReached}
          />
          <StepperInput
            label="Children"
            value={childCount}
            onIncrement={handleIncrementChild}
            onDecrement={handleDecrementChild}
            minDisabled={isChildMinReached}
            maxDisabled={isChildMaxReached}
          />
        </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        Proceed to Review
      </button>
    </form>
  );
};