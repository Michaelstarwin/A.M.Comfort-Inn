import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

export const RoomInventoryList = ({ rooms, isLoading, onEdit, onDelete }) => {

  if (isLoading) {
    return <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">Loading inventory...</div>;
  }

  if (rooms.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-600">No room types found. Create one to get started.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Grid View for Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map((room) => (
          <div key={room.roomId} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            {/* Room Image */}
            <img
              src={room.imageUrl || (room.roomType.toLowerCase().includes('standard') ? "https://www.amcinn.in/Image5.jpeg" : "https://www.amcinn.in/Bedroom.jpeg")}
              alt={room.roomType}
              className="w-full h-48 object-cover"
              onError={(e) => {
                if (e.target.src !== "https://www.amcinn.in/Bedroom.jpeg") {
                  e.target.src = "https://www.amcinn.in/Bedroom.jpeg";
                }
              }}
            />

            {/* Room Details */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{room.roomType}</h3>

              {room.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Rate</p>
                  <p className="font-semibold">₹{room.currentRate.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-semibold">{room.totalRooms}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${room.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {room.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(room)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(room.roomId)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alternative Table View */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => (
              <tr key={room.roomId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={room.imageUrl || (room.roomType.toLowerCase().includes('standard') ? "https://www.amcinn.in/Image5.jpeg" : "https://www.amcinn.in/Bedroom.jpeg")}
                    alt={room.roomType}
                    className="h-10 w-10 rounded object-cover"
                    onError={(e) => {
                      if (e.target.src !== "https://www.amcinn.in/Bedroom.jpeg") {
                        e.target.src = "https://www.amcinn.in/Bedroom.jpeg";
                      }
                    }}
                  />
                </td>
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
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${room.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {room.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => onEdit(room)} className="text-blue-600 hover:text-blue-900" title="Edit">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => onDelete(room.roomId)} className="text-red-600 hover:text-red-900" title="Delete">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};