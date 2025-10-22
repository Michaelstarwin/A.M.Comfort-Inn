import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid'; // npm install @heroicons/react

export const RoomInventoryList = ({ rooms, isLoading, onEdit, onDelete }) => {
  
  if (isLoading) {
    return <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">Loading inventory...</div>;
  }
  
  if (rooms.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">No room types found. Create one to get started.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rooms.map((room) => (
            <tr key={room.roomId}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{room.roomType}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">₹{room.currentRate.toLocaleString()}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{room.totalRooms}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  room.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {room.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onClick={() => onEdit(room)} className="text-blue-600 hover:text-blue-900" title="Edit">
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(room.roomId)} className="text-red-600 hover:text-red-900" title="Deactivate">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};