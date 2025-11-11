import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { config } from '../config/api.config';

// Initialize error tracking
export const initializeErrorTracking = () => {
  if (import.meta.env.MODE === 'production') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.2,
      environment: import.meta.env.MODE,
      release: config.VERSION,
    });
  }
};

// Custom error boundary component
export const ErrorBoundary = Sentry.ErrorBoundary;

// Error reporting utility
export const reportError = (error, context = {}) => {
  console.error(error);
  
  if (import.meta.env.MODE === 'production') {
    Sentry.captureException(error, {
      extra: context
    });
  }
};

// Performance monitoring
export const startPerformanceTransaction = (name, data = {}) => {
  if (import.meta.env.MODE === 'production') {
    const transaction = Sentry.startTransaction({
      name,
      data
    });
    return transaction;
  }
  return null;
};

// Analytics tracking
export const trackEvent = (eventName, properties = {}) => {
  if (window.gtag && import.meta.env.MODE === 'production') {
    window.gtag('event', eventName, properties);
  }
};