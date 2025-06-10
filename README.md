# Arouzy Content Platform

A full-stack content sharing platform built with React.js, Go, and PostgreSQL.

## Project Overview

Arouzy is a content discovery platform that allows users to:
- Browse content with advanced filtering and sorting
- Create accounts and login
- View detailed content information
- Sort and filter content based on popularity, recency, and tags

## Technology Stack

### Frontend
- React.js with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation
- Axios for API requests

### Backend
- Go (Golang) for the API server
- PostgreSQL for the database
- JWT for authentication

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- Go (v1.18 or later)
- PostgreSQL (v13 or later)

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd arouzy
```

2. **Setup the database**
```bash
# Create a PostgreSQL database
createdb arouzy
```

3. **Configure environment variables**
```bash
# Copy the example env file
cp server/.env.example server/.env

# Edit the .env file with your database credentials and JWT secret
```

4. **Install frontend dependencies**
```bash
npm install
```

5. **Start the backend server**
```bash
cd server
go mod download
go run .
```

6. **Start the frontend development server** (in a separate terminal)
```bash
npm run dev
```

The application should now be running at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080

## Project Structure

```
/
├── public/             # Static files
├── src/                # React frontend
│   ├── components/     # Reusable components
│   ├── contexts/       # React context for state management
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── main.tsx        # Entry point
├── server/             # Go backend
│   ├── database/       # Database connection
│   ├── handlers/       # HTTP handlers
│   ├── middleware/     # HTTP middleware
│   ├── models/         # Data models
│   ├── utils/          # Utility functions
│   └── main.go         # Entry point
└── README.md           # Project documentation
```

## Development Notes

### Frontend

The frontend is built with React and uses:
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests
- Context API for state management

### Backend

The backend API is built with Go and follows these patterns:
- RESTful API design
- JWT authentication
- PostgreSQL for data storage
- Middleware for request processing

### Database Schema

The main database tables are:
- `users` - User accounts
- `content` - Content items
- `tags` - Content tags
- `content_tags` - Many-to-many relationship between content and tags
- `upvotes` - Content upvotes

## License

This project is licensed under the MIT License.