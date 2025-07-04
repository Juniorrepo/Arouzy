package middleware

import (
	"context"
	"net/http"
	"strings"

	"project/server/models"
	"project/server/utils"
)

// AuthMiddleware verifies the JWT token and adds the user to the request context
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Extract the token
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		tokenString := tokenParts[1]

		// Validate the token
		claims, err := utils.ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Create user from claims
		user := models.User{
			ID:       claims.UserID,
			Username: claims.Username,
			Email:    claims.Email,
		}

		// Add user to request context
		ctx := context.WithValue(r.Context(), models.UserContextKey, user)

		// Call the next handler with the updated context
		next(w, r.WithContext(ctx))
	}
}

// OptionalAuthMiddleware sets user context if token is present and valid, but does not require authentication
func OptionalAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
				tokenString := tokenParts[1]
				claims, err := utils.ValidateJWT(tokenString)
				if err == nil {
					user := models.User{
						ID:       claims.UserID,
						Username: claims.Username,
						Email:    claims.Email,
					}
					ctx := context.WithValue(r.Context(), models.UserContextKey, user)
					r = r.WithContext(ctx)
				}
			}
		}
		next(w, r)
	}
}
