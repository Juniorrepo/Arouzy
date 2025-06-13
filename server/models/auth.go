package models

// SignupRequest represents the user registration request
type SignupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest represents the user login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents the response after a successful authentication
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// User represents a user in the system
type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// UserProfile represents detailed user information
type UserProfile struct {
	User          User `json:"user"`
	FollowerCount int  `json:"followerCount"`
	UpvotesGiven  int  `json:"upvotesGiven"`
}

// UpdateUserRequest represents the request to update user profile
type UpdateUserRequest struct {
	Username string `json:"username,omitempty"`
	Email    string `json:"email,omitempty"`
	Password string `json:"password,omitempty"`
}

// UserContextKey is the key used to store/retrieve user from context
type userContextKey string

const UserContextKey userContextKey = "user"
