/**
 * Environment configuration
 * Centralized access to environment variables with type safety
 */

interface EnvConfig {
  API_URL: string;
  WS_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
}

export const env: EnvConfig = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
};

// Validate required environment variables in production
if (env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL not set, using default:', env.API_URL);
}
