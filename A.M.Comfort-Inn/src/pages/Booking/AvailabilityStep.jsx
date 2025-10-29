import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingApi } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Schema for validation
const availabilitySchema = z.object({
  roomType: z.string().min(1, 'Please select a room type'),
  roomCount: z.number().int().min(1, 'Must book at least 1 room'),
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
      // Add standard check-in and check-out times
      const requestData = {
        ...data,
        checkInDate: new Date().toISOString().split('T')[0], // Today's date
        checkInTime: "12:00:00", // 12:00 PM
        checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow's date
        checkOutTime: "23:00:00", // 11:00 PM
      };
      const response = await bookingApi.checkAvailability(requestData);
      toast.dismiss();

      if (response.success && response.data.isAvailable) {
        onSuccess({ ...requestData, ...response.data }); // Pass all data up
      } else {
        toast.error(response.message || 'Rooms are not available.');
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

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Standard Check-in/Check-out Times</h3>
        <p className="text-sm text-gray-600">Check-in: 12:00 PM | Check-out: 11:00 PM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect label="Room Type" name="roomType" register={register} error={errors.roomType}>
          <option value="">Select Room Type</option>
          <option value="standard">Standard Room</option>
          <option value="deluxe">Deluxe Room</option>
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