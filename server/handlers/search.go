package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project/server/database"
	"project/server/models"
)

// SearchContentHandler handles content search with multiple criteria
func SearchContentHandler(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	queryParams := r.URL.Query()
	
	// Search query
	searchQuery := strings.TrimSpace(queryParams.Get("q"))
	if searchQuery == "" {
		http.Error(w, "Search query is required", http.StatusBadRequest)
		return
	}

	// Page parameters
	page, err := strconv.Atoi(queryParams.Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	limit := 20
	offset := (page - 1) * limit

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Build the search query with ranking
	query := `
		SELECT DISTINCT c.id, c.title, c.description, c.image_count, c.video_count, c.thumbnail_url, c.created_at,
			(SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes,
			u.id as user_id, u.username as user_username,
			-- Calculate search relevance score
			CASE 
				WHEN c.title ILIKE $1 THEN 100
				WHEN c.title ILIKE $2 THEN 80
				WHEN c.description ILIKE $1 THEN 60
				WHEN c.description ILIKE $2 THEN 40
				WHEN u.username ILIKE $1 THEN 30
				WHEN u.username ILIKE $2 THEN 20
				ELSE 10
			END as relevance_score
		FROM content c
		JOIN users u ON c.user_id = u.id
		WHERE (
			c.title ILIKE $3 OR 
			c.description ILIKE $3 OR 
			u.username ILIKE $3 OR
			c.id IN (
				SELECT DISTINCT ct.content_id 
				FROM content_tags ct 
				JOIN tags t ON ct.tag_id = t.id 
				WHERE t.name ILIKE $3
			)
		)
	`

	// Prepare search patterns
	exactMatch := searchQuery
	partialMatch := "%" + searchQuery + "%"
	searchPattern := "%" + searchQuery + "%"

	args := []interface{}{exactMatch, partialMatch, searchPattern}

	// Add ORDER BY for relevance and recency
	orderClause := `
		ORDER BY relevance_score DESC, 
		(SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) DESC, 
		c.created_at DESC
	`

	// Add pagination
	limitClause := fmt.Sprintf("LIMIT %d OFFSET %d", limit, offset)

	// Complete query
	fullQuery := query + orderClause + limitClause

	// Execute query
	rows, err := database.DBPool.Query(ctx, fullQuery, args...)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Parse results
	contentItems := []models.ContentItem{}
	for rows.Next() {
		var item models.ContentItem
		var createdAt time.Time
		var userID int
		var username string
		var relevanceScore int

		err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Description,
			&item.ImageCount,
			&item.VideoCount,
			&item.Thumbnail,
			&createdAt,
			&item.Upvotes,
			&userID,
			&username,
			&relevanceScore,
		)

		if err != nil {
			http.Error(w, "Error parsing database result", http.StatusInternalServerError)
			return
		}

		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.User = models.User{
			ID:       userID,
			Username: username,
		}

		// Get tags for this content item
		tagRows, err := database.DBPool.Query(ctx,
			`SELECT t.id, t.name 
			FROM tags t 
			JOIN content_tags ct ON t.id = ct.tag_id 
			WHERE ct.content_id = $1 
			ORDER BY t.name ASC`,
			item.ID,
		)
		if err == nil {
			defer tagRows.Close()
			var tags []models.Tag
			for tagRows.Next() {
				var tag models.Tag
				if err := tagRows.Scan(&tag.ID, &tag.Name); err == nil {
					tags = append(tags, tag)
				}
			}
			item.Tags = tags
		}

		// Get images for this content item
		imageRows, err := database.DBPool.Query(ctx,
			`SELECT id, image_url, image_order 
			FROM content_images 
			WHERE content_id = $1 
			ORDER BY image_order ASC, id ASC 
			LIMIT 4`,
			item.ID,
		)
		if err == nil {
			defer imageRows.Close()
			var images []models.Image
			for imageRows.Next() {
				var image models.Image
				if err := imageRows.Scan(&image.ID, &image.ImageURL, &image.ImageOrder); err == nil {
					images = append(images, image)
				}
			}
			item.Images = images
		}

		contentItems = append(contentItems, item)
	}

	// Count total items for pagination
	countQuery := `
		SELECT COUNT(DISTINCT c.id)
		FROM content c
		JOIN users u ON c.user_id = u.id
		WHERE (
			c.title ILIKE $1 OR 
			c.description ILIKE $1 OR 
			u.username ILIKE $1 OR
			c.id IN (
				SELECT DISTINCT ct.content_id 
				FROM content_tags ct 
				JOIN tags t ON ct.tag_id = t.id 
				WHERE t.name ILIKE $1
			)
		)
	`
	var totalItems int

	err = database.DBPool.QueryRow(ctx, countQuery, searchPattern).Scan(&totalItems)
	if err != nil {
		http.Error(w, "Error counting total items", http.StatusInternalServerError)
		return
	}

	totalPages := (totalItems + limit - 1) / limit

	// Build response
	response := models.ContentResponse{
		Content: contentItems,
		Pagination: models.Pagination{
			CurrentPage:  page,
			TotalPages:   totalPages,
			TotalItems:   totalItems,
			ItemsPerPage: limit,
		},
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// SearchSuggestionsHandler provides quick search suggestions
func SearchSuggestionsHandler(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	queryParams := r.URL.Query()
	
	// Search query
	searchQuery := strings.TrimSpace(queryParams.Get("q"))
	if searchQuery == "" {
		http.Error(w, "Search query is required", http.StatusBadRequest)
		return
	}

	// Limit suggestions
	limit := 10

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Build the search query for suggestions
	query := `
		SELECT DISTINCT c.id, c.title, c.description, c.image_count, c.video_count, c.thumbnail_url, c.created_at,
			(SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes,
			u.id as user_id, u.username as user_username
		FROM content c
		JOIN users u ON c.user_id = u.id
		WHERE (
			c.title ILIKE $1 OR 
			c.description ILIKE $1 OR 
			u.username ILIKE $1 OR
			c.id IN (
				SELECT DISTINCT ct.content_id 
				FROM content_tags ct 
				JOIN tags t ON ct.tag_id = t.id 
				WHERE t.name ILIKE $1
			)
		)
		ORDER BY (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) DESC, c.created_at DESC
		LIMIT $2
	`

	searchPattern := "%" + searchQuery + "%"

	// Execute query
	rows, err := database.DBPool.Query(ctx, query, searchPattern, limit)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Parse results
	contentItems := []models.ContentItem{}
	for rows.Next() {
		var item models.ContentItem
		var createdAt time.Time
		var userID int
		var username string

		err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Description,
			&item.ImageCount,
			&item.VideoCount,
			&item.Thumbnail,
			&createdAt,
			&item.Upvotes,
			&userID,
			&username,
		)

		if err != nil {
			http.Error(w, "Error parsing database result", http.StatusInternalServerError)
			return
		}

		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.User = models.User{
			ID:       userID,
			Username: username,
		}

		// Get tags for this content item
		tagRows, err := database.DBPool.Query(ctx,
			`SELECT t.id, t.name 
			FROM tags t 
			JOIN content_tags ct ON t.id = ct.tag_id 
			WHERE ct.content_id = $1 
			ORDER BY t.name ASC`,
			item.ID,
		)
		if err == nil {
			defer tagRows.Close()
			var tags []models.Tag
			for tagRows.Next() {
				var tag models.Tag
				if err := tagRows.Scan(&tag.ID, &tag.Name); err == nil {
					tags = append(tags, tag)
				}
			}
			item.Tags = tags
		}

		contentItems = append(contentItems, item)
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"content": contentItems,
	})
} 