package storage

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var Provider StorageProvider

type StorageProvider interface {
	Upload(ctx context.Context, fileBytes []byte, fileName string) (string, error)
	ReadText(ctx context.Context, fileKey string) (string, error)
	Download(ctx context.Context, fileKey string) ([]byte, error)
	Delete(ctx context.Context, fileKey string) error
}

// Init initializes the storage provider based on environment variables
// STORAGE_TYPE can be "s3", "minio", or "local"
func Init() error {
	storageType := strings.ToLower(os.Getenv("STORAGE_TYPE"))
	if storageType == "" {
		storageType = "s3" // Default to S3
	}

	switch storageType {
	case "s3":
		return initS3Storage()
	case "minio":
		return initMinIOStorage()
	case "local":
		return initLocalStorage()
	default:
		return fmt.Errorf("unknown storage type: %s (must be 's3', 'minio', or 'local')", storageType)
	}
}

// initS3Storage initializes AWS S3 storage
func initS3Storage() error {
	bucket := os.Getenv("S3_BUCKET")
	if bucket == "" {
		return fmt.Errorf("S3_BUCKET environment variable is required for S3 storage")
	}

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return fmt.Errorf("failed to load AWS config: %w", err)
	}

	client := s3.NewFromConfig(cfg)
	Provider = NewS3Storage(client, bucket)
	log.Printf("Storage initialized: AWS S3 (bucket: %s)", bucket)
	return nil
}

// initMinIOStorage initializes MinIO storage
func initMinIOStorage() error {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	bucket := os.Getenv("MINIO_BUCKET")
	useSSLStr := os.Getenv("MINIO_USE_SSL")

	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return fmt.Errorf("MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, and MINIO_BUCKET are required for MinIO storage")
	}

	useSSL := false
	if useSSLStr != "" {
		var err error
		useSSL, err = strconv.ParseBool(useSSLStr)
		if err != nil {
			return fmt.Errorf("invalid MINIO_USE_SSL value: %w", err)
		}
	}

	storage, err := NewMinIOStorage(endpoint, accessKey, secretKey, bucket, useSSL)
	if err != nil {
		return fmt.Errorf("failed to initialize MinIO storage: %w", err)
	}

	Provider = storage
	log.Printf("Storage initialized: MinIO (endpoint: %s, bucket: %s)", endpoint, bucket)
	return nil
}

// initLocalStorage initializes local filesystem storage
func initLocalStorage() error {
	basePath := os.Getenv("LOCAL_STORAGE_PATH")
	if basePath == "" {
		basePath = "./uploads" // Default path
	}

	storage, err := NewLocalStorage(basePath)
	if err != nil {
		return fmt.Errorf("failed to initialize local storage: %w", err)
	}

	Provider = storage
	log.Printf("Storage initialized: Local (path: %s)", basePath)
	return nil
}

// Helper functions for backward compatibility and ease of use
// These can be called directly without passing context

// UploadFile uploads a file to the configured storage provider
func UploadFile(fileBytes []byte, fileName string) (string, error) {
	return Provider.Upload(context.Background(), fileBytes, fileName)
}

// ReadFile reads a text file from the configured storage provider
func ReadFile(fileKey string) (string, error) {
	return Provider.ReadText(context.Background(), fileKey)
}

// DownloadFile downloads a file from the configured storage provider
func DownloadFile(fileKey string) ([]byte, error) {
	return Provider.Download(context.Background(), fileKey)
}

// DeleteFile deletes a file from the configured storage provider
func DeleteFile(fileKey string) error {
	return Provider.Delete(context.Background(), fileKey)
}