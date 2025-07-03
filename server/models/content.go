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

// TradingContent represents a private content item for trading
// (blurred until trade is accepted)
type TradingContent struct {
	ID          int    `json:"id"`
	UserID      int    `json:"userId"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	FileURL     string `json:"fileUrl"`
	CreatedAt   string `json:"createdAt"`
	IsTraded    bool   `json:"isTraded"`
}

// TradeRequest represents a trade offer between users
type TradeRequest struct {
	ID                int    `json:"id"`
	FromUserID        int    `json:"fromUserId"`
	ToUserID          int    `json:"toUserId"`
	TradingContentID  int    `json:"tradingContentId"`
	OfferedContentID  int    `json:"offeredContentId"`
	Status            string `json:"status"` // pending, accepted, rejected
	CreatedAt         string `json:"createdAt"`
}