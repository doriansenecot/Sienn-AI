/**
 * Axios HTTP Client Configuration
 */
import axios, { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import type { ApiError } from '../../types/api';

// Base URL from environment or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long operations like fine-tuning
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Future: Add authentication headers here
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || 'An error occurred';
      
      // Show toast for specific status codes
      if (error.response.status >= 500) {
        toast.error(`Server Error: ${message}`);
      } else if (error.response.status === 404) {
        toast.error(`Not Found: ${message}`);
      } else if (error.response.status === 400) {
        toast.error(`Bad Request: ${message}`);
      }
    } else if (error.request) {
      // Request made but no response received
      toast.error('Network Error: Cannot reach the server');
    } else {
      // Something else happened
      toast.error('Request Error: ' + error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
