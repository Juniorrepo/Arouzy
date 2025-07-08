const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://arouzy.vercel.app",
      "https://arouzy.up.railway.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://arouzy.vercel.app",
      "https://arouzy.up.railway.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
const messagesDir = path.join(uploadsDir, "messages");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(messagesDir)) {
  fs.mkdirSync(messagesDir, { recursive: true });
}

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, messagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "_" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "8f42a73054b1749f8f58848be5e6502c8f8aa78496fdc41879c8d0f5c3c9d8a9";

const connectedUsers = new Map();
const unreadCounts = new Map();

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("railway")
      ? { rejectUnauthorized: false }
      : false,
});

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error("Authentication error: Invalid token"));
  }

  socket.userId = decoded.userId;
  socket.username = decoded.username;
  next();
});

io.on("connection", (socket) => {
  console.log(`User ${socket.userId} (${socket.username}) connected`);

  connectedUsers.set(socket.userId, socket);

  const userUnreadCounts = unreadCounts.get(socket.userId) || {};
  socket.emit("unread_counts", userUnreadCounts);

  // Add heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    socket.emit("ping");
  }, 25000); // Send ping every 25 seconds

  socket.on("pong", () => {
    // Client responded to ping
    console.log(`User ${socket.userId} heartbeat received`);
  });

  socket.on("message", async (data) => {
    const { to, message, attachmentUrl } = data;
    if (!to || (!message && !attachmentUrl)) {
      return;
    }
    const now = new Date();
    const messageData = {
      type: "message",
      from: socket.userId,
      to: to,
      message: message || "",
      attachmentUrl: attachmentUrl || null,
      timestamp: now.toISOString(),
    };
    try {
      await dbPool.query(
        `INSERT INTO messages (from_user_id, to_user_id, message, attachment_url, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [socket.userId, to, message, attachmentUrl, now]
      );
    } catch (err) {
      console.error("Failed to save message to DB:", err);
    }
    const recipientSocket = connectedUsers.get(to);
    if (recipientSocket) {
      recipientSocket.emit("message", messageData);
      console.log(`Message delivered to online user ${to}`);
    } else {
      if (!unreadCounts.has(to)) {
        unreadCounts.set(to, {});
      }
      const userCounts = unreadCounts.get(to);
      userCounts[socket.userId] = (userCounts[socket.userId] || 0) + 1;
      console.log(`User ${to} is offline, message queued`);
    }

    socket.emit("message_sent", messageData);
  });

  socket.on("mark_read", (data) => {
    const { from } = data;

    if (!from) return;

    if (unreadCounts.has(socket.userId)) {
      const userCounts = unreadCounts.get(socket.userId);
      userCounts[from] = 0;

      const senderSocket = connectedUsers.get(from);
      if (senderSocket) {
        senderSocket.emit("message_read", {
          by: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`User ${socket.userId} marked messages from ${from} as read`);
  });

  socket.on("typing_start", (data) => {
    const { to } = data;
    const recipientSocket = connectedUsers.get(to);
    if (recipientSocket) {
      recipientSocket.emit("typing_start", { from: socket.userId });
    }
  });

  socket.on("typing_stop", (data) => {
    const { to } = data;
    const recipientSocket = connectedUsers.get(to);
    if (recipientSocket) {
      recipientSocket.emit("typing_stop", { from: socket.userId });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`User ${socket.userId} disconnected: ${reason}`);
    connectedUsers.delete(socket.userId);
    clearInterval(heartbeat);
  });
});

app.post("/upload/attachment", upload.single("attachment"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/uploads/messages/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    connectedUsers: connectedUsers.size,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/users/connected", (req, res) => {
  const users = Array.from(connectedUsers.keys()).map((userId) => ({
    userId,
    connected: true,
  }));
  res.json(users);
});

app.get("/users/:userId/unread", (req, res) => {
  const userId = parseInt(req.params.userId);
  const userCounts = unreadCounts.get(userId) || {};
  res.json(userCounts);
});

app.get("/messages/history", async (req, res) => {
  const { userA, userB } = req.query;
  if (!userA || !userB)
    return res.status(400).json({ error: "Missing user ids" });
  try {
    const { rows } = await dbPool.query(
      `SELECT id, from_user_id as from, to_user_id as to, message, attachment_url as "attachmentUrl", created_at as timestamp, read_at as "readAt"
       FROM messages
       WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
       ORDER BY created_at ASC`,
      [userA, userB]
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch message history:", err);
    res.status(500).json({ error: "Failed to fetch message history" });
  }
});

app.get("/messages/conversations", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  try {
    const { rows } = await dbPool.query(
      `SELECT
         u.id as userId,
         u.username,
         m.message as lastMessage,
         m.created_at as lastMessageTime,
         COALESCE(SUM(CASE WHEN m.to_user_id = $1 AND m.read_at IS NULL THEN 1 ELSE 0 END), 0) as unreadCount
       FROM (
         SELECT
           CASE WHEN from_user_id = $1 THEN to_user_id ELSE from_user_id END AS other_user_id,
           MAX(created_at) as last_message_time
         FROM messages
         WHERE from_user_id = $1 OR to_user_id = $1
         GROUP BY other_user_id
       ) conv
       JOIN users u ON u.id = conv.other_user_id
       JOIN messages m ON (
         (m.from_user_id = $1 AND m.to_user_id = u.id OR m.from_user_id = u.id AND m.to_user_id = $1)
         AND m.created_at = conv.last_message_time
       )
       GROUP BY u.id, u.username, m.message, m.created_at
       ORDER BY lastMessageTime DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

const PORT = process.env.CHAT_PORT || 3001;

// Add graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Add process error handling
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server running on port ${PORT} 🚀`);
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
