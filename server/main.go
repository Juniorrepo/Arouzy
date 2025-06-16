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
	usersRouter.HandleFunc("/{username}/profile", handlers.GetPublicUserProfileHandler).Methods("GET")
	usersRouter.HandleFunc("/{username}/follow", middleware.AuthMiddleware(handlers.FollowUserHandler)).Methods("POST")
	usersRouter.HandleFunc("/{username}/follow", middleware.AuthMiddleware(handlers.UnfollowUserHandler)).Methods("DELETE")
	usersRouter.HandleFunc("/{username}/follow/status", middleware.AuthMiddleware(handlers.CheckFollowStatusHandler)).Methods("GET")

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

	// File upload route
	apiRouter.HandleFunc("/upload", handlers.UploadHandler).Methods("POST", "OPTIONS")
	// Serve uploaded files
	router.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	// Set up CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "https://arouzy.up.railway.app/"},
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
