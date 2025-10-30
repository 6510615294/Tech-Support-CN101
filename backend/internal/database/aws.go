package database

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var S3Client *s3.Client
var BucketName string

func ConnectS3(bucket string) *s3.Client {
	if S3Client != nil {
		return S3Client
	}

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal("failed to load AWS config:", err)
	}

	S3Client = s3.NewFromConfig(cfg)
	BucketName = bucket

	return S3Client
}
