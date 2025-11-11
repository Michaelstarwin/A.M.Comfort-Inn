import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { adminApi } from '../../utils/api';
import { RoomInventoryForm } from './RoomInventoryForm';

export const AdminInventoryPage = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getRooms();
      if (res.success) setRooms(res.data || []);
      else throw new Error(res.message || 'Failed to fetch rooms');
    } catch (err) {
      toast.error(`Error loading rooms: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const openCreate = () => { setSelectedRoom(null); setShowModal(true); };
  const openEdit = (room) => { setSelectedRoom(room); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedRoom(null); };

  const handleFormSuccess = () => { toast.success('Room saved'); closeModal(); fetchRooms(); };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Deactivate this room type?')) return;
    try { await adminApi.deleteRoom(roomId); toast.success('Deactivated'); fetchRooms(); }
    catch (err) { toast.error(`Error: ${err.message}`); }
  };

  const filtered = rooms.filter(r => !search || (r.roomType || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white shadow rounded p-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Room Inventory</h2>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search room type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
          <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Create Room</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No room types found.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.roomId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img src={r.imageUrl || '/Image5.jpeg'} alt={r.roomType} className="h-12 w-20 object-cover rounded" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.roomType}</div>
                        <div className="text-sm text-gray-500">{r.description || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{Number(r.currentRate).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{r.totalRooms}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => openEdit(r)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(r.roomId)} className="text-red-600 hover:text-red-900">Deactivate</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mt-10 overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedRoom ? 'Edit Room' : 'Create Room'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">Close</button>
            </div>
            <div className="p-4">
              <RoomInventoryForm
                selectedRoom={selectedRoom}
                onSuccess={handleFormSuccess}
                onClear={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
