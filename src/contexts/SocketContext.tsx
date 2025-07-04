import React, { createContext, useContext } from "react";
import { useGlobalSocket } from "../hooks/useGlobalSocket";

interface SocketContextType {
  socket: WebSocket | null;
  sendMessage: (to: number, message: string) => void;
  unreadCounts: { [userId: string]: number };
  on: (event: string, fn: (data: unknown) => void) => void;
  markRead: (from: number) => void;
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
