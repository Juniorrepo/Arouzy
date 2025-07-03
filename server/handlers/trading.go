package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"project/server/database"
	"project/server/models"
)

// UploadTradingContentHandler handles uploading new trading content (private)
func UploadTradingContentHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(50 << 20); err != nil { // 50MB
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	description := r.FormValue("description")
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File not found in form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type (reuse upload handler logic)
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi", ".mkv", ".webm"}
	isValid := false
	for _, allowed := range allowedExtensions {
		if ext == allowed {
			isValid = true
			break
		}
	}
	if !isValid {
		http.Error(w, "Invalid file type. Only images and videos are allowed.", http.StatusBadRequest)
		return
	}

	// Generate unique filename
	timestamp := time.Now().UnixNano()
	filename := fmt.Sprintf("trading_%d_%s", timestamp, header.Filename)

	// Ensure uploads directory exists
	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		http.Error(w, "Unable to create upload directory", http.StatusInternalServerError)
		return
	}

	// Create destination file
	dstPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Unable to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file data
	if _, err := file.Seek(0, 0); err == nil {
		if _, err := dst.ReadFrom(file); err != nil {
			http.Error(w, "Error saving file", http.StatusInternalServerError)
			return
		}
	}

	// Insert trading content into DB
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	var id int
	createdAt := time.Now().Format(time.RFC3339)
	fileUrl := "/uploads/" + filename
	err = database.DBPool.QueryRow(ctx,
		`INSERT INTO trading_content (user_id, title, description, file_url, created_at, is_traded)
		 VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
		user.ID, title, description, fileUrl, createdAt,
	).Scan(&id)
	if err != nil {
		http.Error(w, "Error saving trading content", http.StatusInternalServerError)
		return
	}

	tradingContent := models.TradingContent{
		ID:          id,
		UserID:      user.ID,
		Title:       title,
		Description: description,
		FileURL:     fileUrl,
		CreatedAt:   createdAt,
		IsTraded:    false,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tradingContent)
}

// ListTradingContentHandler lists all trading content (blurred for non-owners)
func ListTradingContentHandler(w http.ResponseWriter, r *http.Request) {
	var userID int
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if ok {
		userID = user.ID
	}
	log.Printf("[DEBUG] ListTradingContentHandler: userID=%d", userID)

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := database.DBPool.Query(ctx, `
		SELECT id, user_id, title, description, file_url, created_at, is_traded
		FROM trading_content
		ORDER BY created_at DESC
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type TradingContentWithAccess struct {
		models.TradingContent
		HasAccess bool `json:"hasAccess"`
	}

	var tradingContent []TradingContentWithAccess
	for rows.Next() {
		var item models.TradingContent
		var createdAt time.Time
		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.Title,
			&item.Description,
			&item.FileURL,
			&createdAt,
			&item.IsTraded,
		)
		if err != nil {
			http.Error(w, "Error parsing database result", http.StatusInternalServerError)
			return
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)

		hasAccess := false
		if userID != 0 && userID == item.UserID {
			hasAccess = true
			log.Printf("[DEBUG] User %d is owner of content %d", userID, item.ID)
		} else if userID != 0 {
			// Check if user has accepted trade for this content as requester
			var count int
			err := database.DBPool.QueryRow(ctx, `
				SELECT COUNT(*) FROM trade_requests
				WHERE trading_content_id = $1 AND from_user_id = $2 AND status = 'accepted'
			`, item.ID, userID).Scan(&count)
			log.Printf("[DEBUG] User %d accepted trade count for content %d: %d", userID, item.ID, count)
			if err == nil && count > 0 {
				hasAccess = true
			}
		}
		tradingContent = append(tradingContent, TradingContentWithAccess{
			TradingContent: item,
			HasAccess:      hasAccess,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tradingContent)
}

// ListMyTradingContentHandler lists the current user's trading content
func ListMyTradingContentHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := database.DBPool.Query(ctx, `
		SELECT id, user_id, title, description, file_url, created_at, is_traded
		FROM trading_content
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tradingContent []models.TradingContent
	for rows.Next() {
		var item models.TradingContent
		var createdAt time.Time
		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.Title,
			&item.Description,
			&item.FileURL,
			&createdAt,
			&item.IsTraded,
		)
		if err != nil {
			http.Error(w, "Error parsing database result", http.StatusInternalServerError)
			return
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)
		tradingContent = append(tradingContent, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tradingContent)
}

// SendTradeRequestHandler handles sending a trade request
func SendTradeRequestHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	type reqBody struct {
		TradingContentId int `json:"tradingContentId"`
		OfferedContentId int `json:"offeredContentId"`
	}
	var req reqBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.TradingContentId == 0 || req.OfferedContentId == 0 {
		http.Error(w, "Missing tradingContentId or offeredContentId", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Get the owner of the trading content (to_user_id)
	var toUserId int
	err := database.DBPool.QueryRow(ctx, "SELECT user_id FROM trading_content WHERE id = $1", req.TradingContentId).Scan(&toUserId)
	if err != nil {
		http.Error(w, "Trading content not found", http.StatusNotFound)
		return
	}

	// Prevent sending trade request to self
	if toUserId == user.ID {
		http.Error(w, "Cannot trade with yourself", http.StatusBadRequest)
		return
	}

	// Insert trade request
	_, err = database.DBPool.Exec(ctx, `
		INSERT INTO trade_requests (from_user_id, to_user_id, trading_content_id, offered_content_id, status, created_at)
		VALUES ($1, $2, $3, $4, 'pending', NOW())
	`, user.ID, toUserId, req.TradingContentId, req.OfferedContentId)
	if err != nil {
		http.Error(w, "Error creating trade request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Trade request sent"})
}

// ListTradeRequestsHandler lists incoming trade requests for the user
func ListTradeRequestsHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	rows, err := database.DBPool.Query(ctx, `
		SELECT id, from_user_id, to_user_id, trading_content_id, offered_content_id, status, created_at
		FROM trade_requests
		WHERE to_user_id = $1 AND status = 'pending'
		ORDER BY created_at DESC
	`, user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []models.TradeRequest
	for rows.Next() {
		var req models.TradeRequest
		var createdAt time.Time
		err := rows.Scan(
			&req.ID,
			&req.FromUserID,
			&req.ToUserID,
			&req.TradingContentID,
			&req.OfferedContentID,
			&req.Status,
			&createdAt,
		)
		if err != nil {
			http.Error(w, "Error parsing database result", http.StatusInternalServerError)
			return
		}
		req.CreatedAt = createdAt.Format(time.RFC3339)
		requests = append(requests, req)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// AcceptTradeRequestHandler handles accepting a trade request
func AcceptTradeRequestHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/trading/request/")
	idStr = strings.TrimSuffix(idStr, "/accept")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	log.Printf("[DEBUG] AcceptTradeRequestHandler: userID=%d accepting tradeRequestID=%d", user.ID, id)
	// Only allow if user is the to_user_id and request is pending
	res, err := database.DBPool.Exec(ctx, `
		UPDATE trade_requests SET status = 'accepted'
		WHERE id = $1 AND to_user_id = $2 AND status = 'pending'
	`, id, user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if res.RowsAffected() == 0 {
		http.Error(w, "Trade request not found or not allowed", http.StatusForbidden)
		return
	}
	log.Printf("[DEBUG] Trade request %d accepted by user %d", id, user.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Trade request accepted"})
}

// RejectTradeRequestHandler handles rejecting a trade request
func RejectTradeRequestHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement reject logic
	w.WriteHeader(http.StatusNotImplemented)
	w.Write([]byte("Reject trade request not implemented yet"))
}

// CLI utility for debugging: Print all trade_requests
func PrintAllTradeRequests() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	rows, err := database.DBPool.Query(ctx, `SELECT id, from_user_id, to_user_id, trading_content_id, offered_content_id, status, created_at FROM trade_requests ORDER BY id`)
	if err != nil {
		log.Printf("[DEBUG] Error querying trade_requests: %v", err)
		return
	}
	defer rows.Close()
	fmt.Println("\n[DEBUG] trade_requests table:")
	for rows.Next() {
		var id, fromUser, toUser, tradingContent, offeredContent int
		var status, createdAt string
		err := rows.Scan(&id, &fromUser, &toUser, &tradingContent, &offeredContent, &status, &createdAt)
		if err != nil {
			log.Printf("[DEBUG] Error scanning trade_requests: %v", err)
			continue
		}
		fmt.Printf("id=%d, from_user_id=%d, to_user_id=%d, trading_content_id=%d, offered_content_id=%d, status=%s, created_at=%s\n", id, fromUser, toUser, tradingContent, offeredContent, status, createdAt)
	}
} 