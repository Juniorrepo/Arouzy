package utils

import (
	"log"
	"os"
	"path/filepath"
)

// GetUploadsDir returns the appropriate uploads directory path
func GetUploadsDir() string {
	// Check if we're on Railway (they set RAILWAY_STATIC_URL)
	if os.Getenv("RAILWAY_STATIC_URL") != "" {
		// Use Railway's persistent volume
		return "/tmp/uploads"
	}
	
	// Check if we're on other cloud platforms
	if os.Getenv("PORT") != "" && os.Getenv("RAILWAY_STATIC_URL") == "" {
		// Likely on a cloud platform, try to use a persistent directory
		// Try /tmp first, then fallback to current directory
		persistentDir := "/tmp/uploads"
		if err := os.MkdirAll(persistentDir, os.ModePerm); err == nil {
			log.Printf("Using persistent uploads directory: %s", persistentDir)
			return persistentDir
		}
		log.Printf("Warning: Could not create persistent directory %s, falling back to local", persistentDir)
	}
	
	// Local development or fallback
	localDir := "./uploads"
	log.Printf("Using local uploads directory: %s", localDir)
	return localDir
}

// EnsureUploadsDir creates the uploads directory and returns the path
func EnsureUploadsDir() (string, error) {
	uploadDir := GetUploadsDir()
	
	// Create the directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}
	
	// Test if the directory is writable
	testFile := filepath.Join(uploadDir, ".test")
	if f, err := os.Create(testFile); err != nil {
		return "", err
	} else {
		f.Close()
		os.Remove(testFile) // Clean up test file
	}
	
	return uploadDir, nil
}

// IsPersistentStorage checks if the current storage is persistent
func IsPersistentStorage() bool {
	uploadDir := GetUploadsDir()
	return uploadDir == "/tmp/uploads"
} 