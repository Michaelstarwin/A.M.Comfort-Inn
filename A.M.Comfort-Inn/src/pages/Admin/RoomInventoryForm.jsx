import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { AdminFormInput, AdminFormSelect } from './AdminFormControl';

// Validation schema
const roomSchema = z.object({
  roomType: z.string().min(3, 'Room type is required'),
  totalRooms: z.number().int().min(1, 'Total rooms must be at least 1'),
  currentRate: z.number().min(1, 'Rate must be a positive number'),
  status: z.enum(['Active', 'Inactive']),
});

export const RoomInventoryForm = ({ selectedRoom, onSuccess, onClear }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(selectedRoom);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomType: selectedRoom?.roomType || '',
      totalRooms: selectedRoom?.totalRooms || 1,
      currentRate: selectedRoom?.currentRate || 1000,
      status: selectedRoom?.status || 'Active',
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await adminApi.updateRoom(selectedRoom.roomId, data);
      } else {
        await adminApi.createRoom(data);
      }
      onSuccess(); // Triggers refresh and clears form
      reset(); // Clear form fields
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md sticky top-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode ? 'Edit Room Type' : 'Create New Room Type'}
        </h2>
        {isEditMode && (
          <button
            type="button"
            onClick={() => { reset(); onClear(); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear (New)
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <AdminFormInput
          label="Room Type Name"
          name="roomType"
          type="text"
          register={register}
          error={errors.roomType}
          placeholder="e.g., Deluxe Suite"
        />
        <AdminFormInput
          label="Total Rooms"
          name="totalRooms"
          type="number"
          register={register}
          error={errors.totalRooms}
          parseAs="number"
        />
        <AdminFormInput
          label="Current Rate (per night)"
          name="currentRate"
          type="number"
          register={register}
          error={errors.currentRate}
          parseAs="number"
        />
        <AdminFormSelect
          label="Status"
          name="status"
          register={register}
          error={errors.status}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </AdminFormSelect>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
        >
          {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Room')}
        </button>
      </div>
    </form>
  );
};