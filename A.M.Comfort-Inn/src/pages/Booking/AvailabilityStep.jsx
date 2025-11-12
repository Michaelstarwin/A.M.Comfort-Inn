import React, { useState, useEffect, useMemo } from 'react';
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
  const [houseStatus, setHouseStatus] = useState({
    deluxeAvailable: true,
    standardRoomsAvailable: 2,
    totalRooms: 2,
    occupiedRooms: 0,
  });
  const [isStatusLoading, setIsStatusLoading] = useState(false);
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

  const rooms = useMemo(() => ([
    {
      name: 'Standard Room',
      dbName: 'standard',
      description: 'Private bedroom with access to the shared living area and kitchen.',
      includedRooms: 1,
      maxRooms: 2,
      highlight: 'Ideal for a couple or solo traveller.',
    },
    {
      name: 'Deluxe Room',
      dbName: 'deluxe',
      description: 'Entire home with two bedrooms, hall, and kitchen reserved just for you.',
      includedRooms: 2,
      maxRooms: 2,
      highlight: 'Fixed price covers both rooms—only your family stays during the booking window.',
    },
  ]), []);

  const roomType = watch('roomType');
  const currentRoomCount = watch('roomCount');
  const checkInDate = watch('checkInDate');
  const checkOutDate = watch('checkOutDate');
  const [isRoomCountEditable, setIsRoomCountEditable] = useState(false);
  const selectedRoom = useMemo(
    () => rooms.find(r => r.name === roomType),
    [rooms, roomType]
  );

  useEffect(() => {
    const fetchHouseStatus = async () => {
      if (!checkInDate || !checkOutDate) {
        return;
      }

      setIsStatusLoading(true);
      try {
        const response = await bookingApi.getAvailabilityStatus({
          checkInDate,
          checkOutDate,
          checkInTime: '12:00:00',
          checkOutTime: '11:00:00',
        });

        if (response?.success && response.data) {
          setHouseStatus(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch availability status:', error);
      } finally {
        setIsStatusLoading(false);
      }
    };

    fetchHouseStatus();
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    if (selectedRoom?.name === 'Deluxe Room' && !houseStatus.deluxeAvailable) {
      setValue('roomType', '');
    }
  }, [selectedRoom, houseStatus.deluxeAvailable, setValue]);

  useEffect(() => {
    if (selectedRoom) {
      if (selectedRoom.name === 'Deluxe Room') {
        setIsRoomCountEditable(false);
        if (currentRoomCount !== selectedRoom.includedRooms) {
          setValue('roomCount', selectedRoom.includedRooms);
        }
      } else {
        if (houseStatus.standardRoomsAvailable <= 0) {
          setIsRoomCountEditable(false);
          if (currentRoomCount !== 0) {
            setValue('roomCount', 0);
          }
          return;
        }

        setIsRoomCountEditable(true);
        const maxByAvailability = Math.max(
          Math.min(
            houseStatus.standardRoomsAvailable,
            selectedRoom.maxRooms ?? selectedRoom.includedRooms
          ),
          1
        );

        const normalizedCount = Math.min(
          Math.max(currentRoomCount || 1, 1),
          maxByAvailability
        );
        if (normalizedCount !== currentRoomCount) {
          setValue('roomCount', normalizedCount);
        }
      }
    } else {
      setIsRoomCountEditable(false);
      setValue('roomCount', 0);
    }
  }, [selectedRoom, setValue, currentRoomCount, houseStatus.standardRoomsAvailable]);

  const onSubmit = async (data) => {
    if (!selectedRoom) {
      toast.error('Please choose a room type.');
      return;
    }

    if (selectedRoom.name === 'Standard Room' && houseStatus.standardRoomsAvailable <= 0) {
      toast.error('Standard room is fully booked for these dates.');
      return;
    }

    if (selectedRoom.name === 'Deluxe Room' && !houseStatus.deluxeAvailable) {
      toast.error('Deluxe stay is unavailable for these dates.');
      return;
    }

    setIsLoading(true);
    toast.loading('Checking availability...');
    try {
      // Get the database room name
      const dbRoomType = selectedRoom?.dbName || data.roomType;

      // Add standard check-in and check-out times
      const requestData = {
        ...data,
        roomType: dbRoomType, // ✅ Use database room name
        checkInTime: "12:00:00", // 12:00 PM
        checkOutTime: "11:00:00", // 11:00 AM
        roomCount: selectedRoom?.name === 'Deluxe Room'
          ? selectedRoom.includedRooms
          : data.roomCount,
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
            {rooms.map(room => {
              const hideDeluxe = room.name === 'Deluxe Room' && !houseStatus.deluxeAvailable;
              if (hideDeluxe) {
                return null;
              }

              const disabled = room.name === 'Standard Room' && houseStatus.standardRoomsAvailable <= 0;
              return (
                <option key={room.name} value={room.name} disabled={disabled}>
                  {disabled ? `${room.name} (Fully Booked)` : room.name}
                </option>
              );
            })}
          </FormSelect>
          {isStatusLoading && (
            <p className="text-xs text-gray-500 mt-2">Checking latest availability…</p>
          )}
          {!isStatusLoading && (
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              <p>Standard rooms free: {Math.max(houseStatus.standardRoomsAvailable, 0)}</p>
              <p>Deluxe stay: {houseStatus.deluxeAvailable ? 'Available' : 'Unavailable for these dates'}</p>
            </div>
          )}
          {roomType && (
            <div className="mt-2 p-3 bg-gray-100 rounded-md">
              <p className="text-sm font-semibold text-gray-700">
                {selectedRoom?.description}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedRoom?.highlight}
              </p>
            </div>
          )}
        </div>
        <FormInput
          label="Number of Rooms"
          name="roomCount"
          type="number"
          register={register}
          error={errors.roomCount}
          parseAs="number"
          readOnly={!isRoomCountEditable}
          disabled={!isRoomCountEditable}
          min={
            selectedRoom?.name === 'Deluxe Room'
              ? selectedRoom.includedRooms
              : houseStatus.standardRoomsAvailable > 0
                ? 1
                : 0
          }
          max={
            selectedRoom?.name === 'Standard Room'
              ? Math.min(
                  houseStatus.standardRoomsAvailable || selectedRoom.maxRooms,
                  selectedRoom.maxRooms ?? selectedRoom.includedRooms
                )
              : selectedRoom?.maxRooms
          }
        />
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-blue-700 transition duration-300 disabled:opacity-50" disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Check Availability'}
      </button>
    </form>
  );
};

// Reusable Form Components (can be moved to their own files)

const FormInput = ({ label, name, type, register, error, parseAs, readOnly, disabled, min, max }) => (
  <div className="w-full">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      type={type}
      {...register(name, { valueAsNumber: parseAs === 'number' })}
      min={min}
      max={max}
      disabled={disabled}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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