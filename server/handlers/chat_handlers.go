package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"project/server/middleware"
	"project/server/models"
)

// GET /messages/users
func GetUsersHandler(cs *ChatService, w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	users, err := cs.GetUsers(userID)
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(users)
}

// GET /messages/{userId}
func GetMessagesHandler(cs *ChatService, w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	otherID, err := strconv.Atoi(mux.Vars(r)["userId"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	messages, err := cs.GetMessages(userID, otherID)
	if err != nil {
		http.Error(w, "Failed to get messages", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(messages)
}

// POST /messages/send/{userId}
func SendMessageHandler(cs *ChatService, w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	recipientID, err := strconv.Atoi(mux.Vars(r)["userId"])
	if err != nil {
		http.Error(w, "Invalid recipient ID", http.StatusBadRequest)
		return
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Content == "" {
		http.Error(w, "Invalid message body", http.StatusBadRequest)
		return
	}
	
	msg := models.Message{
		SenderID:    userID,
		RecipientID: recipientID,
		Content:     body.Content,
		CreatedAt:   time.Now(),
	}

	if err := cs.SendMessage(userID, recipientID, body.Content); err != nil {
		http.Error(w, "Failed to send message", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(msg)
}
