import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminApi } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { AdminFormInput, AdminFormSelect } from './AdminFormControl';
import { XMarkIcon } from '@heroicons/react/24/solid';

// Validation schema
const roomSchema = z.object({
  roomType: z.string().min(3, 'Room type is required'),
  totalRooms: z.number().int().min(1, 'Total rooms must be at least 1'),
  currentRate: z.number().min(1, 'Rate must be a positive number'),
  status: z.enum(['Active', 'Inactive']),
  description: z.string().optional(),
});

export const RoomInventoryForm = ({ selectedRoom, onSuccess, onClear }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(selectedRoom?.imageUrl || null);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const isEditMode = Boolean(selectedRoom);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomType: selectedRoom?.roomType ,
      totalRooms: selectedRoom?.totalRooms || 1,
      currentRate: selectedRoom?.currentRate || 1000,
      status: selectedRoom?.status || 'Active',
      description: selectedRoom?.description || '',
    }
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('roomType', data.roomType);
      formData.append('totalRooms', data.totalRooms.toString());
      formData.append('currentRate', data.currentRate.toString());
      formData.append('status', data.status);
      if (data.description) {
        formData.append('description', data.description);
      }

      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (isEditMode) {
        await adminApi.updateRoom(selectedRoom.roomId, formData);
      } else {
        await adminApi.createRoom(formData);
      }

      onSuccess(); // Triggers refresh and clears form
      reset(); // Clear form fields
      handleRemoveImage();
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
            onClick={() => { reset(); onClear(); handleRemoveImage(); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear (New)
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Image Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Room Image</label>
          
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer text-center py-8 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <p className="text-gray-600">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        <AdminFormInput
          label="Room Type Name"
          name="roomType"
          type="text"
          register={register}
          error={errors.roomType}
          placeholder="e.g., Deluxe Suite"
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            {...register('description')}
            placeholder="Room description and amenities..."
            rows="3"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

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