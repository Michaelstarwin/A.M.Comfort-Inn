import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { adminApi } from '../../utils/api';
import { RoomInventoryForm } from './RoomInventoryForm';
import { RoomInventoryList } from './RoomInventoryList';
import { BookingsManagement } from './BookingsManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AdminLoginPrompt } from '../../components/admin/AdminLoginPrompt';

const AdminDashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState(null);
  const [adminId, setAdminId] = useState(() => localStorage.getItem('adminUserId'));

  const fetchRooms = useCallback(async () => {
    if (!adminId) {
      setIsLoading(false);
      setError("You must be logged in as an admin to view this page.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getRooms();
      if (response.success) {
        setRooms(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch rooms.');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSetAdminId = (id) => {
    localStorage.setItem('adminUserId', id);
    setAdminId(id);
  };

  const handleFormSuccess = () => {
    toast.success('Inventory updated successfully!');
    setSelectedRoom(null); // Clear form
    fetchRooms(); // Refresh list
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    window.scrollTo(0, 0); // Scroll to top to see form
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to deactivate this room type?')) {
      try {
        await adminApi.deleteRoom(roomId);
        toast.success('Room deactivated.');
        fetchRooms(); // Refresh list
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('adminUserId');
      setAdminId(null);
      toast.success('Logged out successfully.');
    }
  };

  if (!adminId) {
    return <AdminLoginPrompt onLogin={handleSetAdminId} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto mt-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <Link to="/admin" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">
                Room Inventory
              </Link>
              <Link to="/admin/bookings" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300">
                Bookings
              </Link>
              <Link to="/admin/analytics" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition duration-300">
                Analytics
              </Link>
            </nav>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1: Form */}
              <div className="lg:col-span-1">
                <RoomInventoryForm
                  key={selectedRoom ? selectedRoom.roomId : 'new'} // Re-mount form on selection
                  selectedRoom={selectedRoom}
                  onSuccess={handleFormSuccess}
                  onClear={() => setSelectedRoom(null)}
                />
              </div>

              {/* Column 2: List */}
              <div className="lg:col-span-2">
                <RoomInventoryList
                  rooms={rooms}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          } />
          <Route path="/bookings" element={<BookingsManagement />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;