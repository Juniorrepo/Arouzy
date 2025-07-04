package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"project/server/database"
	"project/server/handlers"
	"project/server/middleware"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize the database connection
	pool, err := database.InitDB()
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer pool.Close()

	// Create the router
	router := mux.NewRouter()

	// Set up API routes
	apiRouter := router.PathPrefix("/api").Subrouter()

	// Public routes
	apiRouter.HandleFunc("/health", handlers.HealthCheckHandler).Methods("GET")
	// Public user profile route
	usersRouter := apiRouter.PathPrefix("/users").Subrouter()
	usersRouter.HandleFunc("/{id:[0-9]+}", handlers.GetUserByIdHandler).Methods("GET")
	usersRouter.HandleFunc("/{username}/profile", handlers.GetPublicUserProfileHandler).Methods("GET")
	usersRouter.HandleFunc("/{username}/follow", middleware.AuthMiddleware(handlers.FollowUserHandler)).Methods("POST")
	usersRouter.HandleFunc("/{username}/follow", middleware.AuthMiddleware(handlers.UnfollowUserHandler)).Methods("DELETE")
	usersRouter.HandleFunc("/{username}/follow/status", middleware.AuthMiddleware(handlers.CheckFollowStatusHandler)).Methods("GET")
	usersRouter.HandleFunc("/{username}/followers", handlers.GetFollowersHandler).Methods("GET")
	usersRouter.HandleFunc("/{username}/following", handlers.GetFollowingHandler).Methods("GET")

	// Auth routes
	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/signup", handlers.SignupHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")
	authRouter.HandleFunc("/user", middleware.AuthMiddleware(handlers.GetCurrentUserHandler)).Methods("GET")

	// Content routes
	contentRouter := apiRouter.PathPrefix("/content").Subrouter()
	contentRouter.HandleFunc("", handlers.GetContentHandler).Methods("GET")
	contentRouter.HandleFunc("/{id}", handlers.GetContentByIdHandler).Methods("GET")
	contentRouter.HandleFunc("", middleware.AuthMiddleware(handlers.CreateContentHandler)).Methods("POST")

	// User routes
	userRouter := apiRouter.PathPrefix("/user").Subrouter()
	userRouter.HandleFunc("/profile", middleware.AuthMiddleware(handlers.GetUserProfileHandler)).Methods("GET")
	userRouter.HandleFunc("/profile", middleware.AuthMiddleware(handlers.UpdateUserProfileHandler)).Methods("PUT")

	// File upload routes
	apiRouter.HandleFunc("/upload", handlers.UploadHandler).Methods("POST", "OPTIONS")
	apiRouter.HandleFunc("/upload/multiple", handlers.MultipleUploadHandler).Methods("POST", "OPTIONS")
	// Serve uploaded files
	router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Trading routes
	tradingRouter := apiRouter.PathPrefix("/trading").Subrouter()
	tradingRouter.HandleFunc("/upload", middleware.AuthMiddleware(handlers.UploadTradingContentHandler)).Methods("POST")
	tradingRouter.HandleFunc("", middleware.AuthMiddleware(handlers.ListTradingContentHandler)).Methods("GET")
	tradingRouter.HandleFunc("/mine", middleware.AuthMiddleware(handlers.ListMyTradingContentHandler)).Methods("GET")
	tradingRouter.HandleFunc("/request", middleware.AuthMiddleware(handlers.SendTradeRequestHandler)).Methods("POST")
	tradingRouter.HandleFunc("/requests", middleware.AuthMiddleware(handlers.ListTradeRequestsHandler)).Methods("GET")
	tradingRouter.HandleFunc("/request/{id}/accept", middleware.AuthMiddleware(handlers.AcceptTradeRequestHandler)).Methods("POST")
	tradingRouter.HandleFunc("/request/{id}/reject", middleware.AuthMiddleware(handlers.RejectTradeRequestHandler)).Methods("POST")
	
	// Debug route (remove in production)
	tradingRouter.HandleFunc("/debug/requests", handlers.DebugTradeRequestsHandler).Methods("GET")

	// Collections routes
	collectionsRouter := apiRouter.PathPrefix("/collections").Subrouter()
	collectionsRouter.HandleFunc("", middleware.AuthMiddleware(handlers.CreateCollectionHandler)).Methods("POST")
	collectionsRouter.HandleFunc("/my", middleware.AuthMiddleware(handlers.ListMyCollectionsHandler)).Methods("GET")
	collectionsRouter.HandleFunc("/public", handlers.ListPublicCollectionsHandler).Methods("GET")
	collectionsRouter.HandleFunc("/content", middleware.OptionalAuthMiddleware(handlers.GetCollectionContentHandler)).Methods("GET")
	collectionsRouter.HandleFunc("/save", middleware.AuthMiddleware(handlers.SaveToCollectionHandler)).Methods("POST")
	collectionsRouter.HandleFunc("/remove", middleware.AuthMiddleware(handlers.RemoveFromCollectionHandler)).Methods("DELETE")
	collectionsRouter.HandleFunc("/update", middleware.AuthMiddleware(handlers.UpdateCollectionHandler)).Methods("PUT")
	collectionsRouter.HandleFunc("/delete", middleware.AuthMiddleware(handlers.DeleteCollectionHandler)).Methods("DELETE")
	collectionsRouter.HandleFunc("/detail/{id}", middleware.OptionalAuthMiddleware(handlers.GetCollectionHandler)).Methods("GET")

	// Messages routes
	messagesRouter := apiRouter.PathPrefix("/messages").Subrouter()
	messagesRouter.HandleFunc("/conversations", middleware.AuthMiddleware(handlers.ListConversationsHandler)).Methods("GET")
	messagesRouter.HandleFunc("/history", middleware.AuthMiddleware(handlers.GetMessageHistoryHandler)).Methods("GET")

	// WebSocket endpoint for real-time messaging
	router.HandleFunc("/ws", handlers.WebSocketHandler)

	// Set up CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "https://arouzy.up.railway.app", "https://arouzy.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Create the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         "0.0.0.0:" + port,
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
		Handler:      c.Handler(router),
	}

	// Start the server in a goroutine
	go func() {
		fmt.Printf("Server running on port %s\n", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Create a context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Println("Shutting down server...")
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}
