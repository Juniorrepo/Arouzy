package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// UploadResponse represents the response for a single file upload
type UploadResponse struct {
	Filename string `json:"filename"`
	URL      string `json:"url"`
}

// MultipleUploadResponse represents the response for multiple file uploads
type MultipleUploadResponse struct {
	Files []UploadResponse `json:"files"`
	URLs  []string         `json:"urls"`
}

// UploadHandler handles single file uploads
func UploadHandler(w http.ResponseWriter, r *http.Request) {
	// Set response content type
	w.Header().Set("Content-Type", "application/json")

	// Handle CORS preflight
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Parse multipart form with a max memory of 100 MB
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Retrieve the file from form data
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File not found in form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	if !isValidFileType(header.Filename) {
		http.Error(w, "Invalid file type. Only images and videos are allowed.", http.StatusBadRequest)
		return
	}

	// Generate unique filename
	filename := generateUniqueFilename(header.Filename)

	// Ensure uploads directory exists
	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		http.Error(w, "Unable to create upload directory", http.StatusInternalServerError)
		return
	}

	// Create destination file
	dstPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Unable to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file data
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	// Build response with file URL
	resp := UploadResponse{
		Filename: filename,
		URL:      "/uploads/" + filename,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// MultipleUploadHandler handles multiple file uploads
func MultipleUploadHandler(w http.ResponseWriter, r *http.Request) {
	// Set response content type
	w.Header().Set("Content-Type", "application/json")

	// Handle CORS preflight
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Parse multipart form with a max memory of 200 MB
	if err := r.ParseMultipartForm(200 << 20); err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Ensure uploads directory exists
	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		http.Error(w, "Unable to create upload directory", http.StatusInternalServerError)
		return
	}

	var uploadedFiles []UploadResponse
	var uploadedURLs []string

	// Process all files in the form
	for _, files := range r.MultipartForm.File {
		for _, header := range files {
			// Validate file type
			if !isValidFileType(header.Filename) {
				continue // Skip invalid files
			}

			// Open the file
			file, err := header.Open()
			if err != nil {
				continue // Skip files that can't be opened
			}

			// Generate unique filename
			filename := generateUniqueFilename(header.Filename)

			// Create destination file
			dstPath := filepath.Join(uploadDir, filename)
			dst, err := os.Create(dstPath)
			if err != nil {
				file.Close()
				continue // Skip files that can't be created
			}

			// Copy file data
			if _, err := io.Copy(dst, file); err != nil {
				file.Close()
				dst.Close()
				continue // Skip files that can't be copied
			}

			// Close files
			file.Close()
			dst.Close()

			// Add to response
			uploadedFiles = append(uploadedFiles, UploadResponse{
				Filename: filename,
				URL:      "/uploads/" + filename,
			})
			uploadedURLs = append(uploadedURLs, "/uploads/"+filename)
		}
	}

	// Build response
	resp := MultipleUploadResponse{
		Files: uploadedFiles,
		URLs:  uploadedURLs,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// isValidFileType checks if the file type is allowed
func isValidFileType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	allowedExtensions := []string{
		".jpg", ".jpeg", ".png", ".gif", ".webp", // Images
		".mp4", ".mov", ".avi", ".mkv", ".webm", // Videos
	}

	for _, allowed := range allowedExtensions {
		if ext == allowed {
			return true
		}
	}
	return false
}

// generateUniqueFilename creates a unique filename to prevent conflicts
func generateUniqueFilename(originalName string) string {
	ext := filepath.Ext(originalName)
	name := strings.TrimSuffix(originalName, ext)
	timestamp := time.Now().UnixNano()
	return fmt.Sprintf("%s_%d%s", name, timestamp, ext)
}

// MessageAttachmentHandler handles file uploads for chat messages
func MessageAttachmentHandler(w http.ResponseWriter, r *http.Request) {
	// Set response content type
	w.Header().Set("Content-Type", "application/json")

	// Handle CORS preflight
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Parse multipart form with a max memory of 50 MB
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Retrieve the file from form data
	file, header, err := r.FormFile("attachment")
	if err != nil {
		http.Error(w, "File not found in form", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type
	if !isValidFileType(header.Filename) {
		http.Error(w, "Invalid file type. Only images and videos are allowed.", http.StatusBadRequest)
		return
	}

	// Generate unique filename
	filename := generateUniqueFilename(header.Filename)

	// Ensure uploads directory exists
	uploadDir := "uploads/messages"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		http.Error(w, "Unable to create upload directory", http.StatusInternalServerError)
		return
	}

	// Create destination file
	dstPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Unable to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy file data
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	// Build response with file URL
	resp := UploadResponse{
		Filename: filename,
		URL:      "/uploads/messages/" + filename,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
