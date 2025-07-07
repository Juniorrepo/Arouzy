import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Update the MessageData interface
interface MessageData {
  type: "message";
  from: number;
  to: number;
  message: string;
  attachmentUrl?: string;
  timestamp?: string;
}

interface UnreadCountsData {
  [userId: string]: number;
}

interface MessageSentData {
  type: "message";
  from: number;
  to: number;
  message: string;
  attachmentUrl?: string;
  timestamp: string;
}

interface MessageReadData {
  by: number;
  timestamp: string;
}

interface TypingData {
  from: number;
}

type EventListener = (data: any) => void;

export function useGlobalSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{
    [userId: string]: number;
  }>({});
  const listeners = useRef<{ [event: string]: EventListener[] }>({});

  useEffect(() => {
    if (!token) return;

    console.log("🔌 Connecting to Socket.IO chat server...");

    // Connect to the Node.js chat server
    const socketInstance = io("http://localhost:3001", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected to chat server");
      setSocket(socketInstance);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected from chat server:", reason);
      setSocket(null);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🚨 Socket.IO connection error:", error);
    });

    socketInstance.on("message", (data: MessageData) => {
      console.log("📨 Received message:", data);
      setUnreadCounts((prev) => ({
        ...prev,
        [data.from]: (prev[data.from] || 0) + 1,
      }));
      listeners.current["message"]?.forEach((fn) => fn(data));
    });

    socketInstance.on("unread_counts", (data: UnreadCountsData) => {
      console.log("📊 Received unread counts:", data);
      setUnreadCounts(data || {});
    });

    socketInstance.on("message_sent", (data: MessageSentData) => {
      console.log("✅ Message sent confirmation:", data);
      listeners.current["message_sent"]?.forEach((fn) => fn(data));
    });

    socketInstance.on("message_read", (data: MessageReadData) => {
      console.log("👁️ Message read notification:", data);
      listeners.current["message_read"]?.forEach((fn) => fn(data));
    });

    socketInstance.on("typing_start", (data: TypingData) => {
      console.log("⌨️ User started typing:", data);
      listeners.current["typing_start"]?.forEach((fn) => fn(data));
    });

    socketInstance.on("typing_stop", (data: TypingData) => {
      console.log("⌨️ User stopped typing:", data);
      listeners.current["typing_stop"]?.forEach((fn) => fn(data));
    });

    return () => {
      console.log("🔌 Closing Socket.IO connection");
      socketInstance.disconnect();
    };
  }, [token]);

  // Update the sendMessage function
  const sendMessage = useCallback(
    (to: number, message: string, attachmentUrl?: string) => {
      if (socket) {
        const messageData = { to, message, attachmentUrl };
        console.log("📤 Sending message:", messageData);
        socket.emit("message", messageData);
      } else {
        console.warn("⚠️ Cannot send message: Socket.IO not connected");
      }
    },
    [socket]
  );

  const on = useCallback((event: string, fn: EventListener) => {
    listeners.current[event] = listeners.current[event] || [];
    listeners.current[event].push(fn);
  }, []);

  const markRead = useCallback(
    (from: number) => {
      if (socket) {
        const readData = { from };
        console.log("📖 Marking as read:", readData);
        socket.emit("mark_read", readData);
        setUnreadCounts((prev) => ({ ...prev, [from]: 0 }));
      }
    },
    [socket]
  );

  const startTyping = useCallback(
    (to: number) => {
      if (socket) {
        socket.emit("typing_start", { to });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (to: number) => {
      if (socket) {
        socket.emit("typing_stop", { to });
      }
    },
    [socket]
  );

  // Add this function to remove event listeners
  const off = useCallback((event: string, fn: EventListener) => {
    if (listeners.current[event]) {
      listeners.current[event] = listeners.current[event].filter(
        (listener) => listener !== fn
      );
    }
  }, []);

  return {
    socket,
    sendMessage,
    unreadCounts,
    on,
    off,
    markRead,
    startTyping,
    stopTyping,
  };
}
