// API Configuration for different environments
const configs = {
  development: {
    API_URL: 'http://localhost:7700/api',
    RAZORPAY_KEY_ID: 'rzp_live_RgjfGSw269T1W4',
  },
  production: {
    API_URL: import.meta.env.VITE_API_BASE_URL || 'https://a-m-comfort-inn.onrender.com/api',
    RAZORPAY_KEY_ID: 'rzp_live_RgjfGSw269T1W4',
  },
  test: {
    API_URL: 'https://a-m-comfort-inn.onrender.com/api',
    CASHFREE_MODE: 'sandbox',
  }
};

const environment = import.meta.env.MODE || 'development';

export const config = {
  ...configs[environment],
  VERSION: '1.0.0',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};