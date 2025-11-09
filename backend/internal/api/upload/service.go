package upload

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

type UploadService struct {
    Client     *s3.Client
    BucketName string
}

func NewUploadService(client *s3.Client, bucket string) *UploadService {
    return &UploadService{
        Client:     client,
        BucketName: bucket,
    }
}

func (s *UploadService) UploadFile(userID string, ctx context.Context, fileHeader *multipart.FileHeader) (*models.Attachment, error) {
    file, err := fileHeader.Open()
    if err != nil {
        return nil, fmt.Errorf("failed to open file: %w", err)
    }
    defer file.Close()

    fileName := fmt.Sprintf("%d-%s", time.Now().Unix(), fileHeader.Filename)
    fileType := strings.TrimPrefix(filepath.Ext(fileHeader.Filename), ".")

    _, err = s.Client.PutObject(ctx, &s3.PutObjectInput{
        Bucket: aws.String(s.BucketName),
        Key:    aws.String(fileName),
        Body:   file,
        ACL:    types.ObjectCannedACLPublicRead, // Optional
    })
    if err != nil {
        return nil, fmt.Errorf("failed to upload file to S3: %w", err)
    }

    fileURL := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.BucketName, fileName)
    var user models.User 
    database.DB.First(&user, "id = ?", userID)

    attachment := models.Attachment{
        URL:        fileURL,
        FileName:   fileHeader.Filename,
        FileType:   fileType,
        UserID:     user.ID,
        Uploader:   user,
        CreatedAt:  time.Now(),
    }

    if err := database.DB.Create(&attachment).Error; err != nil {
        return nil, fmt.Errorf("failed to save attachment: %w", err)
    }

    return &attachment, nil
}
