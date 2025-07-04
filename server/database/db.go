package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DBPool *pgxpool.Pool

// InitDB initializes the database connection pool
func InitDB() (*pgxpool.Pool, error) {
	// Get database connection string from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default local connection if not set
		dbURL = "postgres://postgres:postgres@localhost:5432/arouzy"
	}

	// Create connection pool configuration
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %v", err)
	}

	// Configure the connection pool
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	// Create a connection pool
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %v", err)
	}

	// Verify the connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %v", err)
	}

	// Set global connection pool
	DBPool = pool

	// Initialize database schema if needed
	if err := initializeSchema(ctx, pool); err != nil {
		log.Printf("Warning: Could not initialize schema: %v", err)
	}

	return pool, nil
}

// initializeSchema creates the database tables if they don't exist
func initializeSchema(ctx context.Context, pool *pgxpool.Pool) error {
	// Create users table
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating users table: %v", err)
	}

	// Create content table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS content (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			title VARCHAR(255) NOT NULL,
			description TEXT,
			image_count INTEGER DEFAULT 0,
			video_count INTEGER DEFAULT 0,
			thumbnail_url VARCHAR(255),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating content table: %v", err)
	}

	// Create tags table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS tags (
			id SERIAL PRIMARY KEY,
			name VARCHAR(50) UNIQUE NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating tags table: %v", err)
	}

	// Create content_tags junction table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS content_tags (
			content_id INTEGER REFERENCES content(id),
			tag_id INTEGER REFERENCES tags(id),
			PRIMARY KEY (content_id, tag_id)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating content_tags table: %v", err)
	}

	// Create upvotes table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS upvotes (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			content_id INTEGER REFERENCES content(id),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(user_id, content_id)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating upvotes table: %v", err)
	}

	// Create follows table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS follows (
			follower_id INTEGER REFERENCES users(id),
			following_id INTEGER REFERENCES users(id),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (follower_id, following_id)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating follows table: %v", err)
	}

	// Create trading_content table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS trading_content (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			title VARCHAR(255) NOT NULL,
			description TEXT,
			file_url VARCHAR(255) NOT NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			is_traded BOOLEAN DEFAULT FALSE
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating trading_content table: %v", err)
	}

	// Create trade_requests table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS trade_requests (
			id SERIAL PRIMARY KEY,
			from_user_id INTEGER REFERENCES users(id),
			to_user_id INTEGER REFERENCES users(id),
			trading_content_id INTEGER REFERENCES trading_content(id),
			offered_content_id INTEGER REFERENCES trading_content(id),
			status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating trade_requests table: %v", err)
	}

	// Create collections table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS collections (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			name VARCHAR(255) NOT NULL,
			description TEXT,
			is_public BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating collections table: %v", err)
	}

	// Create collection_content junction table
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS collection_content (
			id SERIAL PRIMARY KEY,
			collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
			content_id INTEGER REFERENCES content(id) ON DELETE CASCADE,
			added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(collection_id, content_id)
		)
	`)
	if err != nil {
		return fmt.Errorf("error creating collection_content table: %v", err)
	}

	return nil
}
