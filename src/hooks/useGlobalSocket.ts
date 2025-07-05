import { useEffect, useRef, useState, useCallback } from "react";

// Update the MessageData interface
interface MessageData {
  type: "message";
  from: number;
  to: number;
  message: string;
  attachmentUrl?: string;
}

interface UnreadCountsData {
  type: "unread_counts";
  counts: { [userId: string]: number };
}

type SocketData = MessageData | UnreadCountsData;

type EventListener = (data: SocketData) => void;

export function useGlobalSocket(token: string | null) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{
    [userId: string]: number;
  }>({});
  const listeners = useRef<{ [event: string]: EventListener[] }>({});

  useEffect(() => {
    if (!token) return;

    console.log("🔌 Connecting to WebSocket server...");
    // TODO: Change to ws://localhost:8080/ws?token=${token} when developing locally
    const ws = new WebSocket(`https://arouzy.up.railway.app/ws?token=${token}`);
    // const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

    ws.onopen = () => {
      console.log("✅ WebSocket connected to server");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as SocketData;
      console.log("📨 Received message:", data);

      if (data.type === "message") {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.from]: (prev[data.from] || 0) + 1,
        }));
        listeners.current["message"]?.forEach((fn) => fn(data));
      }
      if (data.type === "unread_counts") {
        setUnreadCounts(data.counts || {});
      }
    };

    ws.onclose = (event) => {
      console.log(
        "❌ WebSocket disconnected from server",
        event.code,
        event.reason
      );
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("🚨 WebSocket error:", error);
    };

    return () => {
      console.log("🔌 Closing WebSocket connection");
      ws.close();
    };
  }, [token]);

  // Update the sendMessage function
  const sendMessage = useCallback(
    (to: number, message: string, attachmentUrl?: string) => {
      if (socket) {
        const messageData = { type: "message", to, message, attachmentUrl };
        console.log("📤 Sending message:", messageData);
        socket.send(JSON.stringify(messageData));
      } else {
        console.warn("⚠️ Cannot send message: WebSocket not connected");
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
        const readData = { type: "read", from };
        console.log("📖 Marking as read:", readData);
        socket.send(JSON.stringify(readData));
        setUnreadCounts((prev) => ({ ...prev, [from]: 0 }));
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

  return { socket, sendMessage, unreadCounts, on, off, markRead };
}
