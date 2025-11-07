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