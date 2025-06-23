package models

import "time"

// Message represents a chat message exchanged between users.
type Message struct {
	ID          int       `json:"id"`
	SenderID    int       `json:"senderId"`
	RecipientID int       `json:"recipientId"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"createdAt"`
}