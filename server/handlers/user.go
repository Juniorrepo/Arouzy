package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"project/server/database"
	"project/server/models"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

// GetUserProfileHandler returns the authenticated user's profile
func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by AuthMiddleware)
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Get additional user profile information from database
	var profile models.UserProfile
	profile.User = user

	// Query for user stats
	err := database.DBPool.QueryRow(ctx,
		`SELECT 
			(SELECT COUNT(*) FROM follows WHERE following_id = $1) as follower_count,
			(SELECT COUNT(*) FROM upvotes WHERE user_id = $1) as upvotes_given
		`,
		user.ID,
	).Scan(&profile.FollowerCount, &profile.UpvotesGiven)

	if err != nil {
		http.Error(w, "Error fetching user profile", http.StatusInternalServerError)
		return
	}

	// Return the profile
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

// UpdateUserProfileHandler updates the authenticated user's profile
func UpdateUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by AuthMiddleware)
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Parse request body
	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Start building the query
	query := "UPDATE users SET updated_at = NOW()"
	args := []interface{}{}
	argPosition := 1

	// Add fields to update if they are provided
	if req.Username != "" {
		// Check if username is already taken
		var count int
		err := database.DBPool.QueryRow(ctx,
			"SELECT COUNT(*) FROM users WHERE username = $1 AND id != $2",
			req.Username, user.ID,
		).Scan(&count)

		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if count > 0 {
			http.Error(w, "Username already taken", http.StatusConflict)
			return
		}

		query += ", username = $" + string(argPosition)
		args = append(args, req.Username)
		argPosition++
	}

	if req.Email != "" {
		// Check if email is already taken
		var count int
		err := database.DBPool.QueryRow(ctx,
			"SELECT COUNT(*) FROM users WHERE email = $1 AND id != $2",
			req.Email, user.ID,
		).Scan(&count)

		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		if count > 0 {
			http.Error(w, "Email already registered", http.StatusConflict)
			return
		}

		query += ", email = $" + string(argPosition)
		args = append(args, req.Email)
		argPosition++
	}

	if req.Password != "" {
		// Hash the new password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Error processing password", http.StatusInternalServerError)
			return
		}

		query += ", password_hash = $" + string(argPosition)
		args = append(args, string(hashedPassword))
		argPosition++
	}

	// Add WHERE clause and user ID
	query += " WHERE id = $" + string(argPosition)
	args = append(args, user.ID)

	// Execute the update if there are fields to update
	if len(args) > 1 { // More than just the user ID
		_, err := database.DBPool.Exec(ctx, query, args...)
		if err != nil {
			http.Error(w, "Error updating profile", http.StatusInternalServerError)
			return
		}
	}

	// Update local user object with new values
	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Email != "" {
		user.Email = req.Email
	}

	// Return updated user
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// GetPublicUserProfileHandler returns profile info for any user by username
func GetPublicUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user models.User
	err := database.DBPool.QueryRow(ctx,
		"SELECT id, username, email FROM users WHERE username = $1", username,
	).Scan(&user.ID, &user.Username, &user.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	profile := models.UserProfile{User: user}
	err = database.DBPool.QueryRow(ctx,
		`SELECT 
			(SELECT COUNT(*) FROM follows WHERE following_id = $1) as follower_count,
			(SELECT COUNT(*) FROM upvotes WHERE user_id = $1) as upvotes_given
		`, user.ID,
	).Scan(&profile.FollowerCount, &profile.UpvotesGiven)
	if err != nil {
		http.Error(w, "Error fetching user profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

// FollowUserHandler allows the authenticated user to follow another user
func FollowUserHandler(w http.ResponseWriter, r *http.Request) {
	authUser, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}
	vars := mux.Vars(r)
	username := vars["username"]
	if username == authUser.Username {
		http.Error(w, "Cannot follow yourself", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	// Find target user ID
	var targetID int
	err := database.DBPool.QueryRow(ctx, "SELECT id FROM users WHERE username = $1", username).Scan(&targetID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}
	// Insert follow relationship
	_, err = database.DBPool.Exec(ctx,
		"INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		authUser.ID, targetID,
	)
	if err != nil {
		http.Error(w, "Error following user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UnfollowUserHandler allows the authenticated user to unfollow another user
func UnfollowUserHandler(w http.ResponseWriter, r *http.Request) {
	authUser, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}
	vars := mux.Vars(r)
	username := vars["username"]
	if username == authUser.Username {
		http.Error(w, "Cannot unfollow yourself", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	// Find target user ID
	var targetID int
	err := database.DBPool.QueryRow(ctx, "SELECT id FROM users WHERE username = $1", username).Scan(&targetID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}
	// Delete follow relationship
	_, err = database.DBPool.Exec(ctx,
		"DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
		authUser.ID, targetID,
	)
	if err != nil {
		http.Error(w, "Error unfollowing user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// CheckFollowStatusHandler checks if the authenticated user is following another user
func CheckFollowStatusHandler(w http.ResponseWriter, r *http.Request) {
	authUser, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}
	vars := mux.Vars(r)
	username := vars["username"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Find target user ID
	var targetID int
	err := database.DBPool.QueryRow(ctx, "SELECT id FROM users WHERE username = $1", username).Scan(&targetID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	// Check if follow relationship exists
	var exists bool
	err = database.DBPool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2)",
		authUser.ID, targetID,
	).Scan(&exists)

	if err != nil {
		http.Error(w, "Error checking follow status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"isFollowing": exists})
}
