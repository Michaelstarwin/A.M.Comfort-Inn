// API client utility for making HTTP requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7700/api';
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

   async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // pull out body and headers from options
    const { headers = {}, body, ...restOptions } = options;

    // detect FormData
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    // don't force Content-Type when sending FormData (browser will set boundary)
    const mergedHeaders = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    };

    const config = {
      headers: mergedHeaders,
      ...restOptions,
    };

    // attach admin header if present
    const adminId = localStorage.getItem('adminUserId');
    if (adminId) {
      config.headers['x-user-id'] = adminId;
    }

    // body handling: send FormData as-is, stringify plain objects
    if (body !== undefined && body !== null) {
      if (isFormData) {
        config.body = body;
        // ensure we didn't accidentally set Content-Type
        if (config.headers['Content-Type']) delete config.headers['Content-Type'];
      } else if (typeof body === 'string') {
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // handle no-content responses gracefully
      if (response.status === 204) return null;

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
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
   // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data, // <-- pass FormData or object; request() will stringify if needed
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
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
  // Admin user management
  createAdmin: (data) => apiClient.post('/admin/users', data),
};
