import axios from 'axios';

// Define base URL for different environments
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Content API services
export const contentService = {
  getContent: async (page = 1, sort = 'hot', filters = {}) => {
    return api.get('/api/content', { params: { page, sort, ...filters } });
  },
  getContentById: async (id: string) => {
    return api.get(`/api/content/${id}`);
  },
};

// User API services
export const userService = {
  getUserProfile: async () => {
    return api.get('/api/user/profile');
  },
  updateUserProfile: async (data: any) => {
    return api.put('/api/user/profile', data);
  },
};