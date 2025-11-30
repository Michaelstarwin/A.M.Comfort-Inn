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

export const GuestDetailsStep = ({ onSuccess, roomCount = 1, roomType }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      country: 'India',
    }
  });

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
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FormInput label="Full Name" name="fullName" type="text" register={register} error={errors.fullName} />
        <FormInput label="Email Address" name="email" type="email" register={register} error={errors.email} />
        <FormInput label="Phone Number" name="phone" type="tel" register={register} error={errors.phone} />
        <FormInput label="Country" name="country" type="text" register={register} error={errors.country} />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
        Proceed to Review
      </button>
    </form>
  );
};