import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingApi } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Schema for validation
const availabilitySchema = z.object({
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkInTime: z.string().optional(),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  checkOutTime: z.string().optional(),
  roomType: z.string().min(1, 'Please select a room type'),
  roomCount: z.number().int().min(1, 'Must book at least 1 room'),
}).refine(data => `${data.checkInDate}T${data.checkInTime || '00:00'}` < `${data.checkOutDate}T${data.checkOutTime || '00:00'}`, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOutDate'],
});

export const AvailabilityStep = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      roomCount: 1,
      checkInTime: "12:00:00",
      checkOutTime: "11:00:00"
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    toast.loading('Checking availability...');
    try {
      const response = await bookingApi.checkAvailability(data);
      toast.dismiss();

      if (response.success && response.data.isAvailable) {
        onSuccess({ ...data, ...response.data }); // Pass all data up
      } else {
        toast.error(response.message || 'Rooms are not available for these dates.');
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Failed to check availability.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 1: Check Availability</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label="Check-in Date" name="checkInDate" type="date" register={register} error={errors.checkInDate} />
        <FormInput label="Check-in Time" name="checkInTime" type="time" register={register} error={errors.checkInTime} />
        <FormInput label="Check-out Date" name="checkOutDate" type="date" register={register} error={errors.checkOutDate} />
        <FormInput label="Check-out Time" name="checkOutTime" type="time" register={register} error={errors.checkOutTime} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <FormSelect label="Room Type" name="roomType" register={register} error={errors.roomType}>
          <option value="">Select Room Type</option>
          <option value="standard">Standard Room</option>
          <option value="deluxe">Deluxe Room</option>
          <option value="premium">Premium Suite</option>
        </FormSelect>
        <FormInput label="Number of Rooms" name="roomCount" type="number" register={register} error={errors.roomCount} parseAs="number" />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-blue-700 transition duration-300 disabled:opacity-50" disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Check Availability'}
      </button>
    </form>
  );
};

// Reusable Form Components (can be moved to their own files)

const FormInput = ({ label, name, type, register, error, parseAs }) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      type={type}
      {...register(name, { valueAsNumber: parseAs === 'number' })}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
  </div>
);

const FormSelect = ({ label, name, register, error, children }) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      id={name}
      {...register(name)}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white`}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
  </div>
);