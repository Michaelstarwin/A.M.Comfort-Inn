import React, { useState } from 'react';
import { adminApi } from '../../utils/api';
import { toast } from 'react-hot-toast';

export const AdminCreateForm = ({ onCreated, onCancel }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    setIsSubmitting(true);
    try {
      const res = await adminApi.createAdmin({ email, name });
      if (res.success) {
        toast.success('Admin created successfully.');
        if (onCreated) onCreated(res.data.id);
      } else {
        throw new Error(res.message || 'Failed to create admin');
      }
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      toast.error(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Full name (optional)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded">{isSubmitting ? 'Creating...' : 'Create Admin'}</button>
      </div>
    </form>
  );
};

export default AdminCreateForm;
