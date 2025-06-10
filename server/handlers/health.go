package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"project/server/database"
)

// HealthCheckHandler returns the status of the API and its connections
func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	// Check database connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	dbStatus := "ok"
	if err := database.DBPool.Ping(ctx); err != nil {
		dbStatus = "error"
	}

	// Build response
	response := map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"services": map[string]string{
			"database": dbStatus,
		},
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
