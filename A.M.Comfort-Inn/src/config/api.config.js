// API Configuration for different environments
const configs = {
  development: {
    API_URL: 'http://localhost:7700/api',
    CASHFREE_MODE: 'sandbox',
  },
  production: {
    API_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.amcomfortinn.com/api',
    CASHFREE_MODE: 'production',
  },
  test: {
    API_URL: 'http://localhost:7700/api',
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