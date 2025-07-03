import axios from "axios";

// Define base URL for different environments
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
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
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Content API services
export const contentService = {
  getContent: async (page = 1, sort = "hot", filters = {}) => {
    return api.get("/api/content", { params: { page, sort, ...filters } });
  },
  getContentById: async (id: string) => {
    return api.get(`/api/content/${id}`);
  },
  getContentByUser: async (username: string, page = 1, sort = "hot") => {
    return api.get("/api/content", { params: { page, sort, username } });
  },
  getCollectionsByUser: async (userId: number, page = 1, sort = "hot") => {
    return api.get("/api/content", {
      params: { page, sort, collectedBy: userId },
    });
  },
  createContent: async (contentData: CreateContentRequest) => {
    return api.post("/api/content", contentData);
  },
};

// Upload API services
export const uploadService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadMultipleFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file${index}`, file);
    });

    return api.post("/api/upload/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// User API services
export const userService = {
  getUserProfile: async () => {
    return api.get("/api/user/profile");
  },
  updateUserProfile: async (data: {
    username?: string;
    email?: string;
    bio?: string;
  }) => {
    return api.put("/api/user/profile", data);
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

// Types
export interface CreateContentRequest {
  title: string;
  description?: string;
  imageCount: number;
  videoCount: number;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface UploadResponse {
  filename: string;
  url: string;
}
