/**
 * Logger utility - Disables console logs in production for better performance
 */
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args: any[]): void => {
    // Always log errors, even in production
    console.error(...args);
  },
  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: any[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
