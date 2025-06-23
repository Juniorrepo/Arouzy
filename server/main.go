package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	// "strconv"
	"syscall"
	"time"
	"net/url"

	"project/server/database"
	"project/server/handlers"
	"project/server/middleware"
	socketio "github.com/googollee/go-socket.io"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	pool, err := database.InitDB()
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	router := mux.NewRouter()
	server := socketio.NewServer(nil)
	if server == nil {
		log.Fatal("Failed to initialize socket.io server")
	}

	userSocketMap := make(map[int]string)
	chatService := handlers.NewChatService(pool, server)

	// Socket.IO events
	server.OnConnect("/", func(s socketio.Conn) error {
		// Extract userId from query string in handshake headers
		rawQuery := s.RemoteHeader().Get("Query-String")
		userId := ""
		if rawQuery != "" {
			values, err := url.ParseQuery(rawQuery)
			if err == nil {
				userId = values.Get("userId")
			}
		}
		fmt.Printf("Socket Connected: userId=%s, SocketID=%s, RemoteAddr=%s\n", userId, s.ID(), s.RemoteAddr().String())
		return nil
	})

	server.OnEvent("/", "register", func(s socketio.Conn, userID int) {
		fmt.Printf("Registering user: UserID=%d, SocketID=%s\n", userID, s.ID())
		userSocketMap[userID] = s.ID()
		chatService.AddOnlineUser(userID, s)
		chatService.BroadcastOnlineUsers()
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		fmt.Printf("Socket Disconnected: ID=%s, Reason=%s\n", s.ID(), reason)
		for userID, sid := range userSocketMap {
			if sid == s.ID() {
				delete(userSocketMap, userID)
				break
			}
		}
		chatService.RemoveOnlineUserBySocketID(s.ID())
		chatService.BroadcastOnlineUsers()
	})

	// Handle OPTIONS for /socket.io/
	router.HandleFunc("/socket.io/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.WriteHeader(http.StatusOK)
			return
		}
	}).Methods("OPTIONS")

	router.Handle("/socket.io/", server)
	go func() {
		if err := server.Serve(); err != nil {
			log.Fatalf("SocketIO listen error: %s\n", err)
		}
	}()
	defer server.Close()

	// CORS for /api
	apiRouter := router.PathPrefix("/api").Subrouter()
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	apiRouter.Use(c.Handler)

	// Chat routes
	messageRouter := apiRouter.PathPrefix("/messages").Subrouter()
	messageRouter.HandleFunc("/users", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		handlers.GetUsersHandler(chatService, w, r)
	})).Methods("GET")
	messageRouter.HandleFunc("/{userId}", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		handlers.GetMessagesHandler(chatService, w, r)
	})).Methods("GET")
	messageRouter.HandleFunc("/send/{userId}", middleware.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		handlers.SendMessageHandler(chatService, w, r)
	})).Methods("POST")

	// ... (rest of your API routes as in your code)
	apiRouter.HandleFunc("/health", handlers.HealthCheckHandler).Methods("GET")
	usersRouter := apiRouter.PathPrefix("/users").Subrouter()
	usersRouter.HandleFunc("/{username}/profile", handlers.GetPublicUserProfileHandler).Methods("GET")
	usersRouter.HandleFunc("/{username}/follow", middleware.AuthMiddleware(handlers.FollowUserHandler)).Methods("POST")
	usersRouter.HandleFunc("/{username}/follow", middleware.AuthMiddleware(handlers.UnfollowUserHandler)).Methods("DELETE")
	usersRouter.HandleFunc("/{username}/follow/status", middleware.AuthMiddleware(handlers.CheckFollowStatusHandler)).Methods("GET")

	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/signup", handlers.SignupHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")
	authRouter.HandleFunc("/user", middleware.AuthMiddleware(handlers.GetCurrentUserHandler)).Methods("GET")

	contentRouter := apiRouter.PathPrefix("/content").Subrouter()
	contentRouter.HandleFunc("", handlers.GetContentHandler).Methods("GET")
	contentRouter.HandleFunc("/{id}", handlers.GetContentByIdHandler).Methods("GET")
	contentRouter.HandleFunc("", middleware.AuthMiddleware(handlers.CreateContentHandler)).Methods("POST")

	userRouter := apiRouter.PathPrefix("/user").Subrouter()
	userRouter.HandleFunc("/profile", middleware.AuthMiddleware(handlers.GetUserProfileHandler)).Methods("GET")
	userRouter.HandleFunc("/profile", middleware.AuthMiddleware(handlers.UpdateUserProfileHandler)).Methods("PUT")

	apiRouter.HandleFunc("/upload", handlers.UploadHandler).Methods("POST", "OPTIONS")
	router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	srv := &http.Server{
		Addr:         "0.0.0.0:" + port,
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
		Handler:      c.Handler(router),
	}
	go func() {
		fmt.Printf("Server running on port %s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	log.Println("Shutting down server...")
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	log.Println("Server exiting")
}
