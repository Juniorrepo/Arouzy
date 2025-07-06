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

// Search API services
export const searchService = {
  searchContent: async (query: string, page = 1) => {
    return api.get("/api/search/content", { params: { q: query, page } });
  },
  getSearchSuggestions: async (query: string) => {
    return api.get("/api/search/suggestions", { params: { q: query } });
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
  getFollowers: async (username: string) => {
    return api.get(`/api/users/${username}/followers`);
  },
  getFollowing: async (username: string) => {
    return api.get(`/api/users/${username}/following`);
  },
  getUserById: async (userId: number) => {
    return api.get(`/api/users/${userId}`);
  },
};

// Trading API services
export const tradingService = {
  uploadTradingContent: async (data: FormData) => {
    return api.post("/api/trading/upload", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  listTradingContent: async () => {
    return api.get("/api/trading");
  },
  sendTradeRequest: async (
    tradingContentId: number,
    offeredContentId: number
  ) => {
    return api.post("/api/trading/request", {
      tradingContentId,
      offeredContentId,
    });
  },
  listMyTradingContent: async () => {
    return api.get("/api/trading/mine");
  },
  listTradeRequests: async () => {
    return api.get("/api/trading/requests");
  },
  acceptTradeRequest: async (requestId: number) => {
    return api.post(`/api/trading/request/${requestId}/accept`);
  },
  rejectTradeRequest: async (requestId: number) => {
    return api.post(`/api/trading/request/${requestId}/reject`);
  },
};

// Collections API services
export const collectionService = {
  createCollection: async (data: {
    name: string;
    description?: string;
    isPublic: boolean;
  }) => {
    return api.post("/api/collections", data);
  },
  listMyCollections: async () => {
    return api.get("/api/collections/my");
  },
  listPublicCollections: async (username: string) => {
    return api.get(
      `/api/collections/public?username=${encodeURIComponent(username)}`
    );
  },
  getCollectionContent: async (collectionId: number) => {
    return api.get(`/api/collections/content?collectionId=${collectionId}`);
  },
  getCollectionById: async (collectionId: number) => {
    return api.get(`/api/collections/detail/${collectionId}`);
  },
  saveToCollection: async (collectionId: number, contentId: number) => {
    return api.post("/api/collections/save", { collectionId, contentId });
  },
  removeFromCollection: async (collectionId: number, contentId: number) => {
    return api.delete(
      `/api/collections/remove?collectionId=${collectionId}&contentId=${contentId}`
    );
  },
  updateCollection: async (
    collectionId: number,
    data: { name: string; description?: string; isPublic: boolean }
  ) => {
    return api.put(
      `/api/collections/update?collectionId=${collectionId}`,
      data
    );
  },
  deleteCollection: async (collectionId: number) => {
    return api.delete(`/api/collections/delete?collectionId=${collectionId}`);
  },
};

// Message API services
export const messageService = {
  getConversations: async () => {
    return api.get("/api/messages/conversations");
  },
  getMessageHistory: async (userId: number) => {
    return api.get("/api/messages/history", { params: { userId } });
  },
  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append("attachment", file);

    return api.post("/api/messages/attachment", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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

export interface Collection {
  id: number;
  userId: number;
  name: string;
  description?: string;
  isPublic: boolean;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionContent {
  id: number;
  collectionId: number;
  contentId: number;
  addedAt: string;
}
