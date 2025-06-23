import axios from 'axios';

// Define base URL for different environments
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

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
  getContentByUser: async (username: string, page = 1, sort = 'hot') => {
    return api.get('/api/content', { params: { page, sort, username } });
  },
  getCollectionsByUser: async (userId: number, page = 1, sort = 'hot') => {
    return api.get('/api/content', { params: { page, sort, collectedBy: userId } });
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
  followUser: async (username: string) => {
    return api.post(`/api/users/${username}/follow`);
  },
  unfollowUser: async (username: string) => {
    return api.delete(`/api/users/${username}/follow`);
  },
  getPublicUserProfile: async (username: string) => {
    return api.get(`/api/users/${username}/profile`);
  },
  checkFollowStatus: async (username: string) => {
    return api.get(`/api/users/${username}/follow/status`);
  },
};


// Chat API services
export const chatService = {
  getUsers: async () => {
    return api.get('/api/messages/users');
  },
  getMessages: async (userId: string) => {
    return api.get(`/api/messages/${userId}`);
  },
  sendMessage: async (userId: string, messageData: { text?: string; image?: string }) => {
    return api.post(`/api/messages/send/${userId}`, messageData);
  },
};