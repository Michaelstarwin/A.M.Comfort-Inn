// API client utility for making HTTP requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7700/api';
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add admin user ID header if available
    const adminId = localStorage.getItem('adminUserId');
    if (adminId) {
      config.headers['x-user-id'] = adminId;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export a default instance
const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;

// Export specific API functions for booking
export const bookingApi = {
  checkAvailability: (data) => apiClient.post('/bookings/check-availability', data),
  preBook: (data) => apiClient.post('/bookings/pre-book', data),
  createOrder: (data) => apiClient.post('/bookings/payment/create-order', data),
  verifyPayment: (data) => apiClient.post('/payment/verify', data),
  getBooking: (referenceNumber) => apiClient.get(`/bookings/${referenceNumber}`),
  getAllBookings: (filters) => apiClient.get('/bookings/admin/all', { params: filters }),
  updateBookingStatus: (bookingId, status) => apiClient.put(`/bookings/${bookingId}/status`, { status }),
};

export const roomApi = {
  getRooms: () => apiClient.get('/bookings/rooms'),
  getRoomAvailability: (params) => apiClient.get('/bookings/rooms/availability', { params }),
};

export const adminApi = {
  // Room Management
  getRooms: () => apiClient.get('/bookings/admin/inventory/room-types'),
  createRoom: (data) => apiClient.post('/bookings/admin/inventory/room-types', data),
  updateRoom: (roomId, data) => apiClient.put(`/bookings/admin/inventory/room-types/${roomId}`, data),
  deleteRoom: (roomId) => apiClient.delete(`/bookings/admin/inventory/room-types/${roomId}`),
  
  // Booking Management
  getBookings: (filters = {}) => apiClient.get('/bookings/admin/bookings', { params: filters }),
  getBookingDetails: (bookingId) => apiClient.get(`/bookings/admin/bookings/${bookingId}`),
  updateBookingStatus: (bookingId, status) => apiClient.put(`/bookings/admin/bookings/${bookingId}/status`, { status }),
  
  // Analytics
  getAnalytics: (period = 'month') => apiClient.get('/bookings/admin/analytics', { params: { period } }),
  getRevenue: (period = 'month') => apiClient.get('/bookings/admin/analytics/revenue', { params: { period } }),
  getOccupancyStats: () => apiClient.get('/bookings/admin/analytics/occupancy'),
  getTopRoomTypes: () => apiClient.get('/bookings/admin/analytics/top-rooms'),
};
