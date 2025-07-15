export interface User {
  id: number;
  username: string;
  email: string;
  joinDate: string;
  lastActive: string;
  usergroup: string;
  postsCount: number;
}

export interface Thread {
  id: number;
  title: string;
  author: string;
  photos: number;
  videos: number;
  datePosted: string;
  status: 'active' | 'awaiting_moderation' | 'archived';
  replies: number;
}

export interface Statistics {
  totalUsers: number;
  activeUsers30Days: number;
  newSignups30Days: number;
  totalThreads: number;
  totalPosts: number;
  pendingModeration: number;
}