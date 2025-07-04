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
)

type ChatMessage struct {
	ID        int       `json:"id"`
	From      int       `json:"from"`
	To        int       `json:"to"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
}

type Conversation struct {
	UserID      int    `json:"userId"`
	Username    string `json:"username"`
	LastMessage string `json:"lastMessage,omitempty"`
	UnreadCount int    `json:"unreadCount"`
	LastMessageTime *time.Time `json:"lastMessageTime,omitempty"`
}

// SaveMessage saves a message to the database
func SaveMessage(fromUserID, toUserID int, message string) error {
	ctx := context.Background()
	_, err := database.DBPool.Exec(ctx, `
		INSERT INTO messages (from_user_id, to_user_id, message)
		VALUES ($1, $2, $3)
	`, fromUserID, toUserID, message)
	return err
}

// GetConversations returns all conversations for a user
func GetConversations(userID int) ([]Conversation, error) {
	ctx := context.Background()
	
	// First, get all unique users that have exchanged messages with the current user
	userRows, err := database.DBPool.Query(ctx, `
		SELECT DISTINCT
			CASE 
				WHEN from_user_id = $1 THEN to_user_id 
				ELSE from_user_id 
			END as other_user_id
		FROM messages 
		WHERE from_user_id = $1 OR to_user_id = $1
	`, userID)
	
	if err != nil {
		return nil, err
	}
	defer userRows.Close()

	var conversations []Conversation
	for userRows.Next() {
		var otherUserID int
		if err := userRows.Scan(&otherUserID); err != nil {
			log.Printf("Error scanning user ID: %v", err)
			continue
		}
		
		// Get user details
		var username string
		err = database.DBPool.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", otherUserID).Scan(&username)
		if err != nil {
			log.Printf("Error getting username for user %d: %v", otherUserID, err)
			continue
		}
		
		// Get last message
		var lastMessage string
		var lastMessageTime time.Time
		err = database.DBPool.QueryRow(ctx, `
			SELECT message, created_at 
			FROM messages 
			WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
			ORDER BY created_at DESC 
			LIMIT 1
		`, userID, otherUserID).Scan(&lastMessage, &lastMessageTime)
		if err != nil {
			log.Printf("Error getting last message: %v", err)
			lastMessage = ""
		}
		
		// Get unread count
		var unreadCount int
		err = database.DBPool.QueryRow(ctx, `
			SELECT COUNT(*) 
			FROM messages 
			WHERE from_user_id = $1 AND to_user_id = $2 AND read_at IS NULL
		`, otherUserID, userID).Scan(&unreadCount)
		if err != nil {
			log.Printf("Error getting unread count: %v", err)
			unreadCount = 0
		}
		
		conv := Conversation{
			UserID:          otherUserID,
			Username:        username,
			LastMessage:     lastMessage,
			UnreadCount:     unreadCount,
			LastMessageTime: &lastMessageTime,
		}
		
		conversations = append(conversations, conv)
	}
	
	// Sort by last message time (most recent first)
	for i := 0; i < len(conversations); i++ {
		for j := i + 1; j < len(conversations); j++ {
			if conversations[j].LastMessageTime != nil && conversations[i].LastMessageTime != nil {
				if conversations[j].LastMessageTime.After(*conversations[i].LastMessageTime) {
					conversations[i], conversations[j] = conversations[j], conversations[i]
				}
			}
		}
	}
	
	return conversations, nil
}

// GetMessageHistory returns message history between two users
func GetMessageHistory(userID, otherUserID int) ([]ChatMessage, error) {
	ctx := context.Background()
	
	rows, err := database.DBPool.Query(ctx, `
		SELECT id, from_user_id, to_user_id, message, created_at, read_at
		FROM messages
		WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)
		ORDER BY created_at ASC
	`, userID, otherUserID)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []ChatMessage
	for rows.Next() {
		var msg ChatMessage
		var readAt *time.Time
		
		err := rows.Scan(&msg.ID, &msg.From, &msg.To, &msg.Message, &msg.Timestamp, &readAt)
		if err != nil {
			log.Printf("Error scanning message: %v", err)
			continue
		}
		
		msg.ReadAt = readAt
		messages = append(messages, msg)
	}
	
	return messages, nil
}

// MarkMessagesAsRead marks all messages from a specific user as read
func MarkMessagesAsRead(userID, fromUserID int) error {
	ctx := context.Background()
	_, err := database.DBPool.Exec(ctx, `
		UPDATE messages 
		SET read_at = CURRENT_TIMESTAMP 
		WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL
	`, userID, fromUserID)
	return err
}

// List conversations for the logged-in user
func ListConversationsHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conversations, err := GetConversations(user.ID)
	if err != nil {
		log.Printf("Error getting conversations: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

// Get message history with another user
func GetMessageHistoryHandler(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(models.UserContextKey).(models.User)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	otherUserIDStr := r.URL.Query().Get("userId")
	if otherUserIDStr == "" {
		http.Error(w, "userId parameter required", http.StatusBadRequest)
		return
	}

	otherUserID, err := strconv.Atoi(otherUserIDStr)
	if err != nil {
		http.Error(w, "Invalid userId parameter", http.StatusBadRequest)
		return
	}

	messages, err := GetMessageHistory(user.ID, otherUserID)
	if err != nil {
		log.Printf("Error getting message history: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Mark messages as read
	if err := MarkMessagesAsRead(user.ID, otherUserID); err != nil {
		log.Printf("Error marking messages as read: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}
