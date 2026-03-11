package database

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var S3Client *s3.Client
var BucketName string

func ConnectS3(bucket string) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal("failed to load AWS config:", err)
	}

	S3Client = s3.NewFromConfig(cfg)
	BucketName = bucket
}

func UploadFileToS3(fileBytes []byte, fileName string) (string, error) {
	uploader := manager.NewUploader(S3Client)

	key := fmt.Sprintf("assignments/%d-%s", time.Now().Unix(), fileName)

	_, err := uploader.Upload(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(BucketName),
		Key:    aws.String(key),
		Body:   bytes.NewReader(fileBytes),
	})
	if err != nil {
		fmt.Printf("Error uploading file to S3: %v\n", err)
		return "", err
	}

	return key, nil
}

type BytesReader struct {
	data []byte
	pos  int
}

func NewBytesReader(data []byte) *BytesReader {
	return &BytesReader{data: data}
}

func (r *BytesReader) Read(p []byte) (int, error) {
	if r.pos >= len(r.data) {
		return 0, fmt.Errorf("EOF")
	}
	n := copy(p, r.data[r.pos:])
	r.pos += n
	return n, nil
}

func (r *BytesReader) Seek(offset int64, whence int) (int64, error) {
	switch whence {
	case 0:
		r.pos = int(offset)
	case 1:
		r.pos += int(offset)
	case 2:
		r.pos = len(r.data) + int(offset)
	}
	return int64(r.pos), nil
}

func ReadPythonFileFromS3ByKey(fileKey string) (string, error) {
	ctx := context.TODO()
	
	// Validate that the file is a .py file
	if len(fileKey) < 3 || fileKey[len(fileKey)-3:] != ".py" {
		return "", fmt.Errorf("invalid file: only .py files are allowed")
	}
	
	result, err := S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(BucketName),
		Key:    aws.String(fileKey),
	})
	if err != nil {
		fmt.Printf("Error getting object from S3: %v\n", err)
		return "", err
	}
	defer result.Body.Close()
	
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(result.Body)
	if err != nil {
		fmt.Printf("Error reading file content: %v\n", err)
		return "", err
	}
	
	// Convert bytes to string
	fileContent := buf.String()
	
	// Validate that the content is valid UTF-8 text
	if !isValidUTF8(fileContent) {
		return "", fmt.Errorf("invalid file content: file is not valid text")
	}
	
	return fileContent, nil
}

func DeleteFileFromS3(fileKey string) error {
	ctx := context.TODO()
	
	_, err := S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(BucketName),
		Key:    aws.String(fileKey),
	})
	if err != nil {
		fmt.Printf("Error deleting object from S3: %v\n", err)
		return err
	}
	
	return nil
}

// isValidUTF8 checks if the string contains only valid UTF-8 characters
func isValidUTF8(s string) bool {
	// In Go, strings are always valid UTF-8 by design
	// If the bytes were not valid UTF-8, they would be converted with replacement runes
	// We can check if any replacement runes exist
	for _, r := range s {
		if r == 0xfffd {
			// Unicode replacement character indicates invalid UTF-8
			return false
		}
	}
	return true
}

func DownloadFileFromS3ByKey(fileKey string) ([]byte, error) {
	ctx := context.TODO()
	
	result, err := S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(BucketName),
		Key:    aws.String(fileKey),
	})
	if err != nil {
		fmt.Printf("Error getting object from S3: %v\n", err)
		return nil, err
	}
	defer result.Body.Close()
	
	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(result.Body)
	if err != nil {
		fmt.Printf("Error reading file content: %v\n", err)
		return nil, err
	}
	
	return buf.Bytes(), nil
}

