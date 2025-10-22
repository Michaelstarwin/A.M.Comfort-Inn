import React, { useState } from 'react';

export const AdminLoginPrompt = ({ onLogin }) => {
  const [adminId, setAdminId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (adminId) {
      onLogin(adminId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-xl rounded-lg max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Access Required</h2>
        <p className="text-center text-gray-600 mb-6">
          Please enter your Admin User ID to manage the inventory.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 mb-1">Admin User ID</label>
            <input
              id="adminId"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter your admin ID"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};