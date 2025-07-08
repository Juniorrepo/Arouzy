import React, { createContext, useContext } from "react";
import { Socket } from "socket.io-client";
import { useGlobalSocket } from "../hooks/useGlobalSocket";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (to: number, message: string, attachmentUrl?: string) => void;
  unreadCounts: { [userId: string]: number };
  on: (event: string, fn: (data: unknown) => void) => void;
  off: (event: string, fn: (data: unknown) => void) => void;
  markRead: (from: number) => void;
  startTyping: (to: number) => void;
  stopTyping: (to: number) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const socketData = useGlobalSocket(token);
  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
