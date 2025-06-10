package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"project/server/database"
	"project/server/models"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5"
)

// GetContentHandler retrieves content with pagination and filters
func GetContentHandler(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	queryParams := r.URL.Query()

	// Page parameters
	page, err := strconv.Atoi(queryParams.Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	limit := 20
	offset := (page - 1) * limit

	// Sort parameter
	sort := queryParams.Get("sort")
	if sort == "" {
		sort = "hot" // Default sort
	}

	// Build the query
	query := "SELECT c.id, c.title, c.image_count, c.video_count, c.thumbnail_url, c.created_at, " +
		"(SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes " +
		"FROM content c "

	// Build the WHERE clause based on filters
	whereClause := "WHERE 1=1 "
	args := []interface{}{}
	argPosition := 1

	// Filter by minimum upvotes
	if minUpvotes, err := strconv.Atoi(queryParams.Get("minUpvotes")); err == nil && minUpvotes > 0 {
		whereClause += fmt.Sprintf("AND (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) >= $%d ", argPosition)
		args = append(args, minUpvotes)
		argPosition++
	}

	// Filter by date
	if fromDate := queryParams.Get("fromDate"); fromDate != "" {
		whereClause += fmt.Sprintf("AND c.created_at >= $%d ", argPosition)
		args = append(args, fromDate)
		argPosition++
	}

	// Filter by tags
	if tags, ok := queryParams["tags"]; ok && len(tags) > 0 {
		whereClause += fmt.Sprintf("AND c.id IN (SELECT content_id FROM content_tags ct JOIN tags t ON ct.tag_id = t.id WHERE t.name = ANY($%d)) ", argPosition)
		args = append(args, tags)
		argPosition++
	}

	// Add ORDER BY based on sort parameter
	orderClause := "ORDER BY "
	switch sort {
	case "new":
		orderClause += "c.created_at DESC "
	case "top":
		orderClause += "(SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) DESC, c.created_at DESC "
	case "hot":
		// Hot algorithm: Upvotes combined with recency
		orderClause += "(SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) * (1.0 / (EXTRACT(EPOCH FROM (NOW() - c.created_at))/86400 + 2)^1.5) DESC "
	case "shuffle":
		orderClause += "RANDOM() "
	default:
		orderClause += "c.created_at DESC "
	}

	// Add pagination
	limitClause := fmt.Sprintf("LIMIT %d OFFSET %d", limit, offset)

	// Complete query
	fullQuery := query + whereClause + orderClause + limitClause

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Execute query
	rows, err := database.DBPool.Query(ctx, fullQuery, args...)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Parse results
	var contentItems []models.ContentItem
	for rows.Next() {
		var item models.ContentItem
		var createdAt time.Time

		err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.ImageCount,
			&item.VideoCount,
			&item.Thumbnail,
			&createdAt,
			&item.Upvotes,
		)

		if err != nil {
			http.Error(w, "Error parsing database result", http.StatusInternalServerError)
			return
		}

		item.CreatedAt = createdAt.Format(time.RFC3339)
		contentItems = append(contentItems, item)
	}

	// Count total items for pagination
	countQuery := "SELECT COUNT(*) FROM content c " + whereClause
	var totalItems int

	err = database.DBPool.QueryRow(ctx, countQuery, args...).Scan(&totalItems)
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

// GetContentByIdHandler retrieves a single content item by ID
func GetContentByIdHandler(w http.ResponseWriter, r *http.Request) {
	// Get content ID from URL
	vars := mux.Vars(r)
	contentID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid content ID", http.StatusBadRequest)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Query the content
	var item models.ContentItem
	var createdAt time.Time

	err = database.DBPool.QueryRow(ctx,
		`SELECT c.id, c.title, c.description, c.image_count, c.video_count, 
		c.thumbnail_url, c.created_at, (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) AS upvotes,
		u.id, u.username
		FROM content c 
		JOIN users u ON c.user_id = u.id
		WHERE c.id = $1`,
		contentID,
	).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.ImageCount,
		&item.VideoCount,
		&item.Thumbnail,
		&createdAt,
		&item.Upvotes,
		&item.User.ID,
		&item.User.Username,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "Content not found", http.StatusNotFound)
		} else {
			http.Error(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	item.CreatedAt = createdAt.Format(time.RFC3339)

	// Get tags for the content
	rows, err := database.DBPool.Query(ctx,
		`SELECT t.id, t.name 
		FROM tags t 
		JOIN content_tags ct ON t.id = ct.tag_id 
		WHERE ct.content_id = $1`,
		contentID,
	)
	if err != nil {
		http.Error(w, "Error getting tags", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tags []models.Tag
	for rows.Next() {
		var tag models.Tag
		if err := rows.Scan(&tag.ID, &tag.Name); err != nil {
			http.Error(w, "Error parsing tags", http.StatusInternalServerError)
			return
		}
		tags = append(tags, tag)
	}

	item.Tags = tags

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

// CreateContentHandler handles creation of new content
func CreateContentHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by AuthMiddleware)
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Parse request body
	var req models.CreateContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Begin transaction
	tx, err := database.DBPool.Begin(ctx)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Insert content
	var contentID int
	err = tx.QueryRow(ctx,
		`INSERT INTO content (user_id, title, description, image_count, video_count, thumbnail_url) 
		VALUES ($1, $2, $3, $4, $5, $6) 
		RETURNING id`,
		user.ID, req.Title, req.Description, req.ImageCount, req.VideoCount, req.ThumbnailURL,
	).Scan(&contentID)

	if err != nil {
		http.Error(w, "Error creating content", http.StatusInternalServerError)
		return
	}

	// Handle tags if provided
	if len(req.Tags) > 0 {
		for _, tagName := range req.Tags {
			var tagID int

			// Try to find existing tag or create a new one
			err = tx.QueryRow(ctx,
				`INSERT INTO tags (name) VALUES ($1) 
				ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
				RETURNING id`,
				tagName,
			).Scan(&tagID)

			if err != nil {
				http.Error(w, "Error processing tags", http.StatusInternalServerError)
				return
			}

			// Create link between content and tag
			_, err = tx.Exec(ctx,
				`INSERT INTO content_tags (content_id, tag_id) VALUES ($1, $2)
				ON CONFLICT DO NOTHING`,
				contentID, tagID,
			)

			if err != nil {
				http.Error(w, "Error linking content to tags", http.StatusInternalServerError)
				return
			}
		}
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		http.Error(w, "Error finalizing content creation", http.StatusInternalServerError)
		return
	}

	// Return success response with created content
	response := models.CreateContentResponse{
		ID:        contentID,
		Title:     req.Title,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
