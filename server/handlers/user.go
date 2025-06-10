package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"project/server/database"
	"project/server/models"

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
			(SELECT COUNT(*) FROM content WHERE user_id = $1) as content_count,
			(SELECT COUNT(*) FROM upvotes WHERE user_id = $1) as upvotes_given
		`,
		user.ID,
	).Scan(&profile.ContentCount, &profile.UpvotesGiven)

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
