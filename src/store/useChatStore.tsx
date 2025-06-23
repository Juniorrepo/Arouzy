import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { chatService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  // createdAt(createdAt: any): React.ReactNode;
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  // Add other message properties as needed
}

interface User {
  id: string;
  username: string;
  email: string;
  // Add other user properties as needed
}

interface ChatContextType {
  messages: Message[];
  users: User[];
  selectedUser: User | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: any) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUserState] = useState<User | null>(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const { socket } = useAuth();

  const getUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const res = await chatService.getUsers();
      setUsers(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load users');
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  const getMessages = useCallback(async (userId: string) => {
    setIsMessagesLoading(true);
    try {
      const res = await chatService.getMessages(userId);
      setMessages(res.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsMessagesLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (messageData: any) => {
    if (!selectedUser) return;
    console.log(selectedUser)
    try {
      const res = await chatService.sendMessage(selectedUser.id, messageData);
      console.log(res.data,"hgshegfhsdg")
      setMessages((prevMessages) => [...prevMessages, res.data]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Message send failed');
    }
  }, [selectedUser]);

  const subscribeToMessages = useCallback(() => {
    if (!selectedUser || !socket) return;

    // socket.on('newMessage', (newMessage: Message) => {
    //   // console.log(newMessage)
    //   const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser.id;
    //   if (isMessageSentFromSelectedUser) {
    //     setMessages((prevMessages) => [...prevMessages, newMessage]);
    //   }
    // });
    socket.on('newMessage', (newMessage: Message) => {
      if (
        selectedUser &&
        (newMessage.senderId === selectedUser.id || newMessage.recipientId === selectedUser.id)
      )
      console.log(newMessage,"newMessage",newMessage.recipientId);
       {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });
  }, [selectedUser, socket]);

  

  const unsubscribeFromMessages = useCallback(() => {
    if (socket) {
      socket.off('newMessage');
    }
  }, [socket]);

  const setSelectedUser = useCallback((user: User | null) => {
    setSelectedUserState(user);
  }, []);

  useEffect(() => {
    // Cleanup socket listeners on unmount
    return () => {
      unsubscribeFromMessages();
    };
  }, [unsubscribeFromMessages]);

  const value = {
    messages,
    users,
    selectedUser,
    isUsersLoading,
    isMessagesLoading,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};