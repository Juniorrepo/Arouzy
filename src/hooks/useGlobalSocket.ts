import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [unreadCounts, setUnreadCounts] = useState<{
    [userId: string]: number;
  }>({});
  const listeners = useRef<{ [event: string]: EventListener[] }>({});

  useEffect(() => {
    if (!token) {
      console.log("🔌 No token available, skipping socket connection");
      return;
    }

    console.log("🔌 Connecting to Socket.IO chat server...");
    console.log("🔌 Token available:", !!token);

    const CHAT_SERVER_URL =
      "https://efficient-wholeness-production.up.railway.app";

    console.log("🔌 Chat server URL:", CHAT_SERVER_URL);

    const socketInstance = io(CHAT_SERVER_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000, // 20 second timeout
      forceNew: true,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected to chat server");
      setSocket(socketInstance);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected from chat server:", reason);
      setSocket(null);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("🚨 Socket.IO connection error:", error);
      console.error("🚨 Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
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
    isConnected,
    sendMessage,
    unreadCounts,
    on,
    off,
    markRead,
    startTyping,
    stopTyping,
  };
}
