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
  getBooking: (referenceNumber) => apiClient.get(`/bookings/${referenceNumber}`),
};

export const adminApi = {
  getRooms: () => apiClient.get('/bookings/admin/inventory/room-types'),
  createRoom: (data) => apiClient.post('/bookings/admin/inventory/room-types', data),
  updateRoom: (roomId, data) => apiClient.put(`/bookings/admin/inventory/room-types/${roomId}`, data),
  deleteRoom: (roomId) => apiClient.delete(`/bookings/admin/inventory/room-types/${roomId}`),
};