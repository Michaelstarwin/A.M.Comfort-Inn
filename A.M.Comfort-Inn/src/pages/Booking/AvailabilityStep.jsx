import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookingApi } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Schema for validation
const availabilitySchema = z.object({
  roomType: z.string().min(1, 'Please select a room type'),
  roomCount: z.number().int().min(1, 'Must book at least 1 room'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
});

export const AvailabilityStep = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      roomCount: 1,
      checkInTime: "12:00:00",
      checkOutTime: "11:00:00",
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  });

  const rooms = [
    { name: 'Standard Room', dbName: 'standard', description: '1 Private Bedroom, Shared kitchen and Hall.' },
    { name: 'Deluxe Room', dbName: 'deluxe', description: '2 BHK' }
  ];

  const roomType = watch('roomType');

  useEffect(() => {
    if (roomType === 'Standard Room') {
      setValue('roomCount', 1);
    } else if (roomType === 'Deluxe Room') {
      setValue('roomCount', 2);
    } else { // When no room type is selected
      setValue('roomCount', 0);
    }
  }, [roomType, setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    toast.loading('Checking availability...');
    try {
      // Get the database room name
      const selectedRoom = rooms.find(r => r.name === data.roomType);
      const dbRoomType = selectedRoom?.dbName || data.roomType;

      // Add standard check-in and check-out times
      const requestData = {
        ...data,
        roomType: dbRoomType, // ✅ Use database room name
        checkInTime: "12:00:00", // 12:00 PM
        checkOutTime: "11:00:00", // 11:00 AM
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
        <p className="text-sm text-gray-600">Check-in: 12:00 PM | Check-out: 11:00 AM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label="Check-in Date" name="checkInDate" type="date" register={register} error={errors.checkInDate} />
        <FormInput label="Check-out Date" name="checkOutDate" type="date" register={register} error={errors.checkOutDate} />
        <div>
          <FormSelect label="Room Type" name="roomType" register={register} error={errors.roomType}>
            <option value="">Select Room Type</option>
            {rooms.map(room => (
              <option key={room.name} value={room.name}>{room.name}</option>
            ))}
          </FormSelect>
          {roomType && (
            <div className="mt-2 p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-red-500">{rooms.find(r => r.name === roomType)?.description}</p>
            </div>
          )}
        </div>
        <FormInput label="Number of Rooms" name="roomCount" type="number" register={register} error={errors.roomCount} parseAs="number" readOnly />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-blue-700 transition duration-300 disabled:opacity-50" disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Check Availability'}
      </button>
    </form>
  );
};

// Reusable Form Components (can be moved to their own files)

const FormInput = ({ label, name, type, register, error, parseAs, readOnly }) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      type={type}
      {...register(name, { valueAsNumber: parseAs === 'number' })}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
      readOnly={readOnly}
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