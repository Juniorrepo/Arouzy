package handlers

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/googollee/go-socket.io"
	"github.com/jackc/pgx/v5/pgxpool"
	"project/server/models"
)


// ChatService manages chat-related operations
type ChatService struct {
	pool        *pgxpool.Pool
	server      *socketio.Server
	onlineUsers map[int]socketio.Conn // ✅ use interface, not pointer
	onlineMutex sync.RWMutex
}

func (cs *ChatService) LogOnlineUsers() {
	cs.onlineMutex.RLock()
	defer cs.onlineMutex.RUnlock()
	var onlineUserIDs []int
	for userID := range cs.onlineUsers {
		onlineUserIDs = append(onlineUserIDs, userID)
	}
	fmt.Printf("[Socket] Online users: %v\n", onlineUserIDs)
}

func (cs *ChatService) BroadcastOnlineUsers() {
	cs.onlineMutex.RLock()
	defer cs.onlineMutex.RUnlock()
	var onlineUserIDs []int
	for userID := range cs.onlineUsers {
		onlineUserIDs = append(onlineUserIDs, userID)
	}
	cs.server.BroadcastToNamespace("/", "getOnlineUsers", onlineUserIDs)
	cs.LogOnlineUsers()
}

// NewChatService initializes a new ChatService instance
func NewChatService(pool *pgxpool.Pool, server *socketio.Server) *ChatService {
	return &ChatService{
		pool:        pool,
		server:      server,
		onlineUsers: make(map[int]socketio.Conn), // ✅ correct type here
	}
}

// GetUsers fetches all users except the authenticated user
func (cs *ChatService) GetUsers(userID int) ([]models.User, error) {
	var users []models.User
	rows, err := cs.pool.Query(context.Background(), `
		SELECT id, username, email
		FROM users
		WHERE id != $1
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var user models.User
		err := rows.Scan(&user.ID, &user.Username, &user.Email)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %v", err)
		}
		users = append(users, user)
	}
	return users, nil
}

// GetMessages retrieves messages between the authenticated user and another user
func (cs *ChatService) GetMessages(userID, otherUserID int) ([]models.Message, error) {
	var messages []models.Message
	rows, err := cs.pool.Query(context.Background(), `
		SELECT id, sender_id, recipient_id, content, created_at
		FROM messages
		WHERE (sender_id = $1 AND recipient_id = $2)
		OR (sender_id = $2 AND recipient_id = $1)
		ORDER BY created_at ASC
	`, userID, otherUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var msg models.Message
		err := rows.Scan(&msg.ID, &msg.SenderID, &msg.RecipientID, &msg.Content, &msg.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %v", err)
		}
		messages = append(messages, msg)
	}
	return messages, nil
}

// SendMessage sends a new message and broadcasts it to the recipient
func (cs *ChatService) SendMessage(senderID, recipientID int, content string) error {
	if senderID == recipientID {
		return errors.New("cannot send message to self")
	}

	// Save the message to the database
	_, err := cs.pool.Exec(context.Background(), `
		INSERT INTO messages (sender_id, recipient_id, content)
		VALUES ($1, $2, $3)
	`, senderID, recipientID, content)
	if err != nil {
		return fmt.Errorf("failed to save message: %v", err)
	}

	// Broadcast if recipient is online
	cs.onlineMutex.RLock()
	defer cs.onlineMutex.RUnlock()
	// if conn, ok := cs.onlineUsers[recipientID]; ok {
	// 	msg := models.Message{
	// 		SenderID:    senderID,
	// 		RecipientID: recipientID,
	// 		Content:     content,
	// 		CreatedAt:   time.Now(),
	// 	}
	// 	conn.Emit("newMessage", msg)
	// }

	// if conn, ok := cs.onlineUsers[recipientID]; ok {
		msg := models.Message{
			SenderID:    senderID,
			RecipientID: recipientID,
			Content:     content,
			CreatedAt:   time.Now(),
		}
		// conn.Emit("newMessage", msg)
		// Emit to recipient if online
		if conn, ok := cs.onlineUsers[recipientID]; ok {
			conn.Emit("newMessage", msg)
		}
		// Emit to sender as well
		if conn, ok := cs.onlineUsers[senderID]; ok {
			conn.Emit("newMessage", msg)
		}
	// }
	// // Emit to sender as well
	// if conn, ok := cs.onlineUsers[senderID]; ok {
	// 	conn.Emit("newMessage", msg)
	// }

	// // Emit to sender as well
	// if conn, ok := cs.onlineUsers[senderID]; ok {
	// 	conn.Emit("newMessage", msg)
	// }

	return nil
}

// AddOnlineUser adds a user to the online users map
func (cs *ChatService) AddOnlineUser(userID int, conn socketio.Conn) {
	cs.onlineMutex.Lock()
	defer cs.onlineMutex.Unlock()
	cs.onlineUsers[userID] = conn
	cs.updateOnlineUsers()
}

// RemoveOnlineUser removes a user from the online users map
func (cs *ChatService) RemoveOnlineUser(userID int) {
	cs.onlineMutex.Lock()
	defer cs.onlineMutex.Unlock()
	delete(cs.onlineUsers, userID)
	cs.updateOnlineUsers()
}

// updateOnlineUsers broadcasts the list of online user IDs
func (cs *ChatService) updateOnlineUsers() {
	cs.onlineMutex.RLock()
	defer cs.onlineMutex.RUnlock()

	var onlineUserIDs []int
	for userID := range cs.onlineUsers {
		onlineUserIDs = append(onlineUserIDs, userID)
	}

	cs.server.BroadcastToNamespace("/", "getOnlineUsers", onlineUserIDs)
	cs.LogOnlineUsers()
}

// RemoveOnlineUserBySocketID removes a user by matching the socket ID
func (cs *ChatService) RemoveOnlineUserBySocketID(socketID string) {
	cs.onlineMutex.Lock()
	defer cs.onlineMutex.Unlock()

	for userID, conn := range cs.onlineUsers {
		if conn.ID() == socketID {
			delete(cs.onlineUsers, userID)
			break
		}
	}
	cs.updateOnlineUsers()
}
