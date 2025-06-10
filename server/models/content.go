package models

// ContentItem represents a single content item
type ContentItem struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	ImageCount  int    `json:"imageCount"`
	VideoCount  int    `json:"videoCount"`
	Thumbnail   string `json:"thumbnail"`
	CreatedAt   string `json:"createdAt"`
	Upvotes     int    `json:"upvotes"`
	User        User   `json:"user,omitempty"`
	Tags        []Tag  `json:"tags,omitempty"`
}

// Pagination represents pagination metadata
type Pagination struct {
	CurrentPage  int `json:"currentPage"`
	TotalPages   int `json:"totalPages"`
	TotalItems   int `json:"totalItems"`
	ItemsPerPage int `json:"itemsPerPage"`
}

// ContentResponse represents the API response for content listings
type ContentResponse struct {
	Content    []ContentItem `json:"content"`
	Pagination Pagination    `json:"pagination"`
}

// Tag represents a content tag
type Tag struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// CreateContentRequest represents the request to create new content
type CreateContentRequest struct {
	Title        string   `json:"title"`
	Description  string   `json:"description,omitempty"`
	ImageCount   int      `json:"imageCount"`
	VideoCount   int      `json:"videoCount"`
	ThumbnailURL string   `json:"thumbnailUrl,omitempty"`
	Tags         []string `json:"tags,omitempty"`
}

// CreateContentResponse represents the response after content creation
type CreateContentResponse struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	CreatedAt string `json:"createdAt"`
}