import { User, Thread, Statistics } from '../types';

export const mockUsers: User[] = [
  {
    id: 1,
    username: 'alice_cooper',
    email: 'alice@example.com',
    joinDate: '2023-01-15',
    lastActive: '2024-01-20',
    usergroup: 'member',
    postsCount: 45
  },
  {
    id: 2,
    username: 'bob_wilson',
    email: 'bob@example.com',
    joinDate: '2023-03-22',
    lastActive: '2024-01-19',
    usergroup: 'moderator',
    postsCount: 128
  },
  {
    id: 3,
    username: 'charlie_brown',
    email: 'charlie@example.com',
    joinDate: '2023-12-05',
    lastActive: '2024-01-18',
    usergroup: 'member',
    postsCount: 12
  },
  {
    id: 4,
    username: 'diana_prince',
    email: 'diana@example.com',
    joinDate: '2024-01-10',
    lastActive: '2024-01-17',
    usergroup: 'vip',
    postsCount: 23
  }
];

export const mockThreads: Thread[] = [
  {
    id: 1,
    title: 'Recent nudes posted',
    author: 'user123',
    photos: 4,
    videos: 5,
    datePosted: 'January 6th, 2023',
    status: 'awaiting_moderation',
    replies: 12
  },
  {
    id: 2,
    title: 'Weekly discussion thread',
    author: 'moderator_jane',
    photos: 0,
    videos: 0,
    datePosted: 'January 5th, 2023',
    status: 'active',
    replies: 34
  },
  {
    id: 3,
    title: 'Site rules and guidelines',
    author: 'admin',
    photos: 1,
    videos: 2,
    datePosted: 'January 1st, 2023',
    status: 'active',
    replies: 8
  }
];

export const mockStatistics: Statistics = {
  totalUsers: 15847,
  activeUsers30Days: 3421,
  newSignups30Days: 892,
  totalThreads: 2341,
  totalPosts: 18923,
  pendingModeration: 47
};