package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"project/server/utils"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { 
		origin := r.Header.Get("Origin")
		log.Printf("WebSocket connection from origin: %s", origin)
		return true 
	},
}

type wsConn struct {
	UserID int
	Conn   *websocket.Conn
}

var wsClients = struct {
	sync.RWMutex
	clients map[int]*wsConn
}{clients: make(map[int]*wsConn)}

// Message format
// {type: "message", to: userId, message: string}
type wsMessage struct {
	Type    string `json:"type"`
	To      int    `json:"to"`
	Message string `json:"message"`
	From    int    `json:"from,omitempty"`
	Unread  int    `json:"unread,omitempty"`
}

// In-memory unread count (for demo; use DB in prod)
var wsUnread = struct {
	sync.RWMutex
	counts map[int]map[int]int // userId -> fromUserId -> count
}{counts: make(map[int]map[int]int)}

func wsAddUnread(to, from int) {
	wsUnread.Lock()
	if wsUnread.counts[to] == nil {
		wsUnread.counts[to] = make(map[int]int)
	}
	wsUnread.counts[to][from]++
	wsUnread.Unlock()
}

func wsClearUnread(user, from int) {
	wsUnread.Lock()
	if wsUnread.counts[user] != nil {
		wsUnread.counts[user][from] = 0
	}
	wsUnread.Unlock()
}

func wsGetUnread(user int) map[int]int {
	wsUnread.RLock()
	copy := make(map[int]int)
	for k, v := range wsUnread.counts[user] {
		copy[k] = v
	}
	wsUnread.RUnlock()
	return copy
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		log.Printf("WebSocket connection failed: Missing token")
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	claims, err := utils.ValidateJWT(token)
	if err != nil {
		log.Printf("WebSocket connection failed: Invalid token - %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}
	userID := claims.UserID

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("WebSocket connection established for user %d", userID)

	wsClients.Lock()
	wsClients.clients[userID] = &wsConn{UserID: userID, Conn: conn}
	wsClients.Unlock()
	defer func() {
		wsClients.Lock()
		delete(wsClients.clients, userID)
		wsClients.Unlock()
		log.Printf("WebSocket connection closed for user %d", userID)
	}()

	// Send initial unread counts
	unread := wsGetUnread(userID)
	conn.WriteJSON(map[string]interface{}{
		"type": "unread_counts",
		"counts": unread,
	})
	log.Printf("Sent initial unread counts to user %d: %v", userID, unread)

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}
		var msg wsMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			continue
		}
		if msg.Type == "message" && msg.To != 0 && msg.Message != "" {
			log.Printf("Received message from user %d to user %d: %s", userID, msg.To, msg.Message)
			
			// Save message to database
			if err := SaveMessage(userID, msg.To, msg.Message); err != nil {
				log.Printf("Error saving message to database: %v", err)
				continue
			}
			log.Printf("Message saved to database successfully")
			
			// Broadcast to recipient if online
			wsClients.RLock()
			recipient, ok := wsClients.clients[msg.To]
			wsClients.RUnlock()
			msg.From = userID
			if ok {
				log.Printf("Broadcasting message to online user %d", msg.To)
				recipient.Conn.WriteJSON(msg)
			} else {
				log.Printf("User %d is offline, adding to unread count", msg.To)
				wsAddUnread(msg.To, userID)
			}
		}
		if msg.Type == "read" && msg.From != 0 {
			wsClearUnread(userID, msg.From)
			// Mark messages as read in database
			if err := MarkMessagesAsRead(userID, msg.From); err != nil {
				log.Printf("Error marking messages as read in database: %v", err)
			}
		}
	}
} 