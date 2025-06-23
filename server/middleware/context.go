package middleware

import (
	"context"
	"project/server/models"
)

// GetUserIDFromContext extracts the user ID from the request context
func GetUserIDFromContext(ctx context.Context) int {
	user, ok := ctx.Value(models.UserContextKey).(models.User)
	if !ok {
		return 0 // or handle error/log if needed
	}
	return user.ID
}
