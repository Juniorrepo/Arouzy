# Arouzy Chat Server

A real-time chat server built with Node.js and Socket.IO for the Arouzy application.

## Features

- Real-time messaging using Socket.IO
- JWT authentication
- File attachments (images)
- Typing indicators
- Read receipts
- Unread message counts
- Online/offline status

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `env.example`:

```bash
cp env.example .env
```

3. Update the `.env` file with your configuration:

```env
CHAT_PORT=3001
JWT_SECRET=your-secret-key-here
```

4. Start the server:

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### File Upload

- `POST /upload/attachment` - Upload message attachments

### Debug Endpoints

- `GET /users/connected` - List connected users
- `GET /users/:userId/unread` - Get unread counts for a user

## Socket.IO Events

### Client to Server

- `message` - Send a message
- `mark_read` - Mark messages as read
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client

- `message` - Receive a message
- `message_sent` - Message sent confirmation
- `message_read` - Message read notification
- `unread_counts` - Unread message counts
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

## Message Format

```javascript
{
  type: 'message',
  from: 123,
  to: 456,
  message: 'Hello!',
  attachmentUrl: '/uploads/messages/image_123.jpg',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

## Authentication

The server uses JWT tokens for authentication. The token should be passed in the Socket.IO connection:

```javascript
const socket = io("http://localhost:3001", {
  auth: {
    token: "your-jwt-token",
  },
});
```

## File Uploads

Message attachments are stored in the `uploads/messages/` directory and served statically at `/uploads/`.

Supported file types: Images only (JPEG, PNG, GIF, etc.)
Maximum file size: 10MB

## Production Considerations

- Use a proper database instead of in-memory storage
- Implement message persistence
- Add rate limiting
- Use Redis for scaling Socket.IO
- Implement proper error handling and logging
- Add SSL/TLS for secure connections
