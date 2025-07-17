package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"project/server/database"
	"project/server/models"
)

// UserDashboardResponse represents the dashboard data for a user
type UserDashboardResponse struct {
	User        models.User       `json:"user"`
	Content     []models.ContentItem `json:"content"`
	Collections []models.Collection  `json:"collections"`
	Stats       UserStats           `json:"stats"`
}

// UserStats represents user statistics
type UserStats struct {
	ContentCount    int `json:"contentCount"`
	CollectionCount int `json:"collectionCount"`
	TotalUpvotes    int `json:"totalUpvotes"`
	FollowerCount   int `json:"followerCount"`
}

// GetUserDashboardHandler returns comprehensive user dashboard data
func GetUserDashboardHandler(w http.ResponseWriter, r *http.Request) {
	// Get user from context (set by AuthMiddleware)
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Initialize response
	response := UserDashboardResponse{
		User: user,
	}

	// Get user's content
	contentRows, err := database.DBPool.Query(ctx, `
		SELECT c.id, c.title, c.description, c.image_count, c.video_count, 
		       c.thumbnail_url, c.created_at,
		       (SELECT COUNT(*) FROM upvotes WHERE content_id = c.id) as upvotes
		FROM content c
		WHERE c.user_id = $1
		ORDER BY c.created_at DESC
		LIMIT 20
	`, user.ID)
	if err != nil {
		http.Error(w, "Error fetching user content", http.StatusInternalServerError)
		return
	}
	defer contentRows.Close()

	var content []models.ContentItem
	for contentRows.Next() {
		var item models.ContentItem
		var createdAt time.Time
		var description *string

		err := contentRows.Scan(
			&item.ID,
			&item.Title,
			&description,
			&item.ImageCount,
			&item.VideoCount,
			&item.Thumbnail,
			&createdAt,
			&item.Upvotes,
		)
		if err != nil {
			http.Error(w, "Error parsing content", http.StatusInternalServerError)
			return
		}

		item.CreatedAt = createdAt.Format(time.RFC3339)
		if description != nil {
			item.Description = *description
		}
		item.User = user

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
			var images []models.Image
			for imageRows.Next() {
				var image models.Image
				if err := imageRows.Scan(&image.ID, &image.ImageURL, &image.ImageOrder); err == nil {
					images = append(images, image)
				}
			}
			imageRows.Close()
			item.Images = images
		}

		content = append(content, item)
	}
	response.Content = content

	// Get user's collections
	collectionRows, err := database.DBPool.Query(ctx, `
		SELECT c.id, c.user_id, c.name, c.description, c.is_public, c.created_at, c.updated_at,
		       COUNT(cc.content_id) as content_count
		FROM collections c
		LEFT JOIN collection_content cc ON c.id = cc.collection_id
		WHERE c.user_id = $1
		GROUP BY c.id
		ORDER BY c.updated_at DESC
	`, user.ID)
	if err != nil {
		http.Error(w, "Error fetching user collections", http.StatusInternalServerError)
		return
	}
	defer collectionRows.Close()

	var collections []models.Collection
	for collectionRows.Next() {
		var collection models.Collection
		var createdAt, updatedAt time.Time
		var description *string

		err := collectionRows.Scan(
			&collection.ID,
			&collection.UserID,
			&collection.Name,
			&description,
			&collection.IsPublic,
			&createdAt,
			&updatedAt,
			&collection.ContentCount,
		)
		if err != nil {
			http.Error(w, "Error parsing collections", http.StatusInternalServerError)
			return
		}

		collection.CreatedAt = createdAt.Format(time.RFC3339)
		collection.UpdatedAt = updatedAt.Format(time.RFC3339)
		if description != nil {
			collection.Description = *description
		}

		collections = append(collections, collection)
	}
	response.Collections = collections

	// Get user statistics
	var stats UserStats
	err = database.DBPool.QueryRow(ctx, `
		SELECT 
			(SELECT COUNT(*) FROM content WHERE user_id = $1) as content_count,
			(SELECT COUNT(*) FROM collections WHERE user_id = $1) as collection_count,
			(SELECT COUNT(*) FROM upvotes u JOIN content c ON u.content_id = c.id WHERE c.user_id = $1) as total_upvotes,
			(SELECT COUNT(*) FROM follows WHERE following_id = $1) as follower_count
	`, user.ID).Scan(&stats.ContentCount, &stats.CollectionCount, &stats.TotalUpvotes, &stats.FollowerCount)
	if err != nil {
		http.Error(w, "Error fetching user statistics", http.StatusInternalServerError)
		return
	}
	response.Stats = stats

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}