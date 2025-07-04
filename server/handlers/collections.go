package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"project/server/database"
	"project/server/models"

	"github.com/gorilla/mux"
)

// CreateCollectionHandler creates a new collection
func CreateCollectionHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	var req models.CreateCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Collection name is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var id int
	createdAt := time.Now().Format(time.RFC3339)
	err := database.DBPool.QueryRow(ctx, `
		INSERT INTO collections (user_id, name, description, is_public, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5) RETURNING id
	`, user.ID, req.Name, req.Description, req.IsPublic, createdAt).Scan(&id)
	if err != nil {
		log.Printf("Error creating collection: %v", err)
		http.Error(w, "Error creating collection", http.StatusInternalServerError)
		return
	}

	collection := models.Collection{
		ID:          id,
		UserID:      user.ID,
		Name:        req.Name,
		Description: req.Description,
		IsPublic:    req.IsPublic,
		ContentCount: 0,
		CreatedAt:   createdAt,
		UpdatedAt:   createdAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(collection)
}

// ListMyCollectionsHandler lists the current user's collections
func ListMyCollectionsHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := database.DBPool.Query(ctx, `
		SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at,
		       COUNT(cc.content_id) as content_count
		FROM collections c
		LEFT JOIN collection_content cc ON c.id = cc.collection_id
		WHERE c.user_id = $1
		GROUP BY c.id
		ORDER BY c.updated_at DESC
	`, user.ID)
	if err != nil {
		log.Printf("Error querying collections: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var collections []models.Collection
	for rows.Next() {
		var collection models.Collection
		var createdAt, updatedAt time.Time
		err := rows.Scan(
			&collection.ID,
			&collection.UserID,
			&collection.Name,
			&collection.Description,
			&collection.IsPublic,
			&createdAt,
			&updatedAt,
			&collection.ContentCount,
		)
		if err != nil {
			log.Printf("Error scanning collection: %v", err)
			continue
		}
		collection.CreatedAt = createdAt.Format(time.RFC3339)
		collection.UpdatedAt = updatedAt.Format(time.RFC3339)
		collections = append(collections, collection)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collections)
}

// ListPublicCollectionsHandler lists public collections for a user
func ListPublicCollectionsHandler(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username == "" {
		http.Error(w, "Username parameter is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// First get the user ID
	var userID int
	err := database.DBPool.QueryRow(ctx, "SELECT id FROM users WHERE username = $1", username).Scan(&userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	rows, err := database.DBPool.Query(ctx, `
		SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at,
		       COUNT(cc.content_id) as content_count
		FROM collections c
		LEFT JOIN collection_content cc ON c.id = cc.collection_id
		WHERE c.user_id = $1 AND c.is_public = true
		GROUP BY c.id
		ORDER BY c.updated_at DESC
	`, userID)
	if err != nil {
		log.Printf("Error querying public collections: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var collections []models.Collection
	for rows.Next() {
		var collection models.Collection
		var createdAt, updatedAt time.Time
		err := rows.Scan(
			&collection.ID,
			&collection.UserID,
			&collection.Name,
			&collection.Description,
			&collection.IsPublic,
			&createdAt,
			&updatedAt,
			&collection.ContentCount,
		)
		if err != nil {
			log.Printf("Error scanning collection: %v", err)
			continue
		}
		collection.CreatedAt = createdAt.Format(time.RFC3339)
		collection.UpdatedAt = updatedAt.Format(time.RFC3339)
		collections = append(collections, collection)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collections)
}

// GetCollectionContentHandler gets content from a specific collection
func GetCollectionContentHandler(w http.ResponseWriter, r *http.Request) {
	collectionIDStr := r.URL.Query().Get("collectionId")
	if collectionIDStr == "" {
		http.Error(w, "Collection ID is required", http.StatusBadRequest)
		return
	}

	collectionID, err := strconv.Atoi(collectionIDStr)
	if err != nil {
		http.Error(w, "Invalid collection ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Check if collection exists and is accessible
	var isPublic bool
	var userID int
	err = database.DBPool.QueryRow(ctx, `
		SELECT user_id, is_public FROM collections WHERE id = $1
	`, collectionID).Scan(&userID, &isPublic)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	// Check if user can access this collection
	currentUser, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		// Not authenticated, only show public collections
		if !isPublic {
			http.Error(w, "Collection not found", http.StatusNotFound)
			return
		}
	} else {
		// Authenticated user, check if they own the collection or if it's public
		if currentUser.ID != userID && !isPublic {
			http.Error(w, "Collection not found", http.StatusNotFound)
			return
		}
	}

	// Get content from collection
	rows, err := database.DBPool.Query(ctx, `
		SELECT c.id, c.user_id, c.title, c.description, c.image_count, c.video_count, 
		       c.thumbnail_url, c.created_at, cc.added_at,
		       u.username,
		       (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) as upvotes
		FROM collection_content cc
		JOIN content c ON cc.content_id = c.id
		JOIN users u ON c.user_id = u.id
		WHERE cc.collection_id = $1
		ORDER BY cc.added_at DESC
	`, collectionID)
	if err != nil {
		log.Printf("Error querying collection content: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var contentItems []models.ContentItem
	for rows.Next() {
		var item models.ContentItem
		var createdAt, addedAt time.Time
		var username string
		err := rows.Scan(
			&item.ID,
			&item.User.ID,
			&item.Title,
			&item.Description,
			&item.ImageCount,
			&item.VideoCount,
			&item.Thumbnail,
			&createdAt,
			&addedAt,
			&username,
			&item.Upvotes,
		)
		if err != nil {
			log.Printf("Error scanning content item: %v", err)
			continue
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.User.Username = username
		contentItems = append(contentItems, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contentItems)
}

// SaveToCollectionHandler saves content to a collection
func SaveToCollectionHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	var req models.SaveToCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.CollectionID == 0 || req.ContentID == 0 {
		http.Error(w, "Collection ID and Content ID are required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Check if collection belongs to user
	var collectionUserID int
	err := database.DBPool.QueryRow(ctx, `
		SELECT user_id FROM collections WHERE id = $1
	`, req.CollectionID).Scan(&collectionUserID)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if collectionUserID != user.ID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Check if content exists
	var contentExists bool
	err = database.DBPool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM content WHERE id = $1)
	`, req.ContentID).Scan(&contentExists)
	if err != nil || !contentExists {
		http.Error(w, "Content not found", http.StatusNotFound)
		return
	}

	// Add content to collection
	_, err = database.DBPool.Exec(ctx, `
		INSERT INTO collection_content (collection_id, content_id, added_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (collection_id, content_id) DO NOTHING
	`, req.CollectionID, req.ContentID)
	if err != nil {
		log.Printf("Error saving to collection: %v", err)
		http.Error(w, "Error saving to collection", http.StatusInternalServerError)
		return
	}

	// Update collection's updated_at timestamp
	_, err = database.DBPool.Exec(ctx, `
		UPDATE collections SET updated_at = NOW() WHERE id = $1
	`, req.CollectionID)
	if err != nil {
		log.Printf("Error updating collection timestamp: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Content saved to collection"})
}

// RemoveFromCollectionHandler removes content from a collection
func RemoveFromCollectionHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	collectionIDStr := r.URL.Query().Get("collectionId")
	contentIDStr := r.URL.Query().Get("contentId")
	
	if collectionIDStr == "" || contentIDStr == "" {
		http.Error(w, "Collection ID and Content ID are required", http.StatusBadRequest)
		return
	}

	collectionID, err := strconv.Atoi(collectionIDStr)
	if err != nil {
		http.Error(w, "Invalid collection ID", http.StatusBadRequest)
		return
	}

	contentID, err := strconv.Atoi(contentIDStr)
	if err != nil {
		http.Error(w, "Invalid content ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Check if collection belongs to user
	var collectionUserID int
	err = database.DBPool.QueryRow(ctx, `
		SELECT user_id FROM collections WHERE id = $1
	`, collectionID).Scan(&collectionUserID)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if collectionUserID != user.ID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Remove content from collection
	res, err := database.DBPool.Exec(ctx, `
		DELETE FROM collection_content WHERE collection_id = $1 AND content_id = $2
	`, collectionID, contentID)
	if err != nil {
		log.Printf("Error removing from collection: %v", err)
		http.Error(w, "Error removing from collection", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Content not found in collection", http.StatusNotFound)
		return
	}

	// Update collection's updated_at timestamp
	_, err = database.DBPool.Exec(ctx, `
		UPDATE collections SET updated_at = NOW() WHERE id = $1
	`, collectionID)
	if err != nil {
		log.Printf("Error updating collection timestamp: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Content removed from collection"})
}

// UpdateCollectionHandler updates a collection
func UpdateCollectionHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	collectionIDStr := r.URL.Query().Get("collectionId")
	if collectionIDStr == "" {
		http.Error(w, "Collection ID is required", http.StatusBadRequest)
		return
	}

	collectionID, err := strconv.Atoi(collectionIDStr)
	if err != nil {
		http.Error(w, "Invalid collection ID", http.StatusBadRequest)
		return
	}

	var req models.CreateCollectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Collection name is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Check if collection belongs to user
	var collectionUserID int
	err = database.DBPool.QueryRow(ctx, `
		SELECT user_id FROM collections WHERE id = $1
	`, collectionID).Scan(&collectionUserID)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if collectionUserID != user.ID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Update collection
	updatedAt := time.Now().Format(time.RFC3339)
	res, err := database.DBPool.Exec(ctx, `
		UPDATE collections SET name = $1, description = $2, is_public = $3, updated_at = $4
		WHERE id = $5
	`, req.Name, req.Description, req.IsPublic, updatedAt, collectionID)
	if err != nil {
		log.Printf("Error updating collection: %v", err)
		http.Error(w, "Error updating collection", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Collection updated successfully"})
}

// GetCollectionHandler gets a specific collection by ID
func GetCollectionHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collectionIDStr := vars["id"]
	if collectionIDStr == "" {
		http.Error(w, "Collection ID is required", http.StatusBadRequest)
		return
	}

	collectionID, err := strconv.Atoi(collectionIDStr)
	if err != nil {
		http.Error(w, "Invalid collection ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Get collection details
	var collection models.Collection
	var createdAt, updatedAt time.Time
	err = database.DBPool.QueryRow(ctx, `
		SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at,
		       COUNT(cc.content_id) as content_count
		FROM collections c
		LEFT JOIN collection_content cc ON c.id = cc.collection_id
		WHERE c.id = $1
		GROUP BY c.id
	`, collectionID).Scan(
		&collection.ID,
		&collection.UserID,
		&collection.Name,
		&collection.Description,
		&collection.IsPublic,
		&createdAt,
		&updatedAt,
		&collection.ContentCount,
	)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	// Check if user can access this collection
	currentUser, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		// Not authenticated, only show public collections
		if !collection.IsPublic {
			http.Error(w, "Collection not found", http.StatusNotFound)
			return
		}
	} else {
		// Authenticated user, check if they own the collection or if it's public
		if currentUser.ID != collection.UserID && !collection.IsPublic {
			http.Error(w, "Collection not found", http.StatusNotFound)
			return
		}
	}

	collection.CreatedAt = createdAt.Format(time.RFC3339)
	collection.UpdatedAt = updatedAt.Format(time.RFC3339)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collection)
}

// DeleteCollectionHandler deletes a collection
func DeleteCollectionHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	collectionIDStr := r.URL.Query().Get("collectionId")
	if collectionIDStr == "" {
		http.Error(w, "Collection ID is required", http.StatusBadRequest)
		return
	}

	collectionID, err := strconv.Atoi(collectionIDStr)
	if err != nil {
		http.Error(w, "Invalid collection ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Check if collection belongs to user
	var collectionUserID int
	err = database.DBPool.QueryRow(ctx, `
		SELECT user_id FROM collections WHERE id = $1
	`, collectionID).Scan(&collectionUserID)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if collectionUserID != user.ID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	// Delete collection (cascade will handle collection_content)
	res, err := database.DBPool.Exec(ctx, `
		DELETE FROM collections WHERE id = $1
	`, collectionID)
	if err != nil {
		log.Printf("Error deleting collection: %v", err)
		http.Error(w, "Error deleting collection", http.StatusInternalServerError)
		return
	}

	if res.RowsAffected() == 0 {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Collection deleted successfully"})
} 