import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import io, { Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  onlineUsers:any;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  useEffect(() => {
    // Check if user is already logged in via token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
        // Cleanup socket on unmount
    return () => {
      if (socket?.connected) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      connectSocket();
    }
    // Optionally disconnect on logout
    return () => disconnectSocket();
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/api/auth/user');
      setUser(response.data);
    } catch (err) {
      console.error('Authentication check failed', err);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setError(null);
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/signup', { username, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // const connectSocket = () => {
  //   if (!user || socket?.connected) return;

  //   const newSocket = io("skfkshdf", {
  //     query: {
  //       userId: user.id,
  //     },
  //   });

  //   newSocket.connect();
  //   setSocket(newSocket);

  //   newSocket.on('getOnlineUsers', (userIds: string[]) => {
  //     setOnlineUsers(userIds);
  //   });
  // };

  const disconnectSocket = () => {
    if (socket?.connected) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const connectSocket = () => {
  if (!user || socket?.connected) return;

  const newSocket = io("http://localhost:8081", {
    query: { userId: user.id },
    transports: ['polling', 'websocket'], // optional, but can help with Go backend
    // withCredentials: true, // optional, if you use cookies
  });

  setSocket(newSocket);

  newSocket.on('connect', () => {
    newSocket.emit('register', user.id);
  });
  
  newSocket.on('getOnlineUsers', (userIds: string[]) => {
    console.log(userIds)
    setOnlineUsers(userIds);
  });
    // const disconnectSocket = () => {
  //   if (socket?.connected) {
  //     socket.disconnect();
  //     setSocket(null);
  //   }
};


  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    error,
    connectSocket,
    disconnectSocket,
    onlineUsers,socket
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};