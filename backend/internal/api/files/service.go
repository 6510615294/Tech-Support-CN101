package file

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"strings"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func DownloadSubmissions(assignmentID string) ([]byte, error) {
	var submissions []models.Submission
	err := database.DB.
		Preload("Attachment").
		Preload("Student").
		Find(&submissions, "assignment_id = ?", assignmentID).Error
	
	if err != nil {
		return nil, errors.New("failed to fetch submissions")
	}
	
	zipBuffer := new(bytes.Buffer)
	zipWriter := zip.NewWriter(zipBuffer)
	
	fileCount := 0
	
	for _, submission := range submissions {
		if submission.Attachment == nil {
			continue
		}
		
		fileBytes, err := database.DownloadFileFromS3ByKey(submission.Attachment.FileKey)
		if err != nil {
			fmt.Printf("Error downloading file %s: %v\n", submission.Attachment.FileName, err)
			continue
		}
		
		safeFileName := sanitizeFileName(submission.Attachment.FileName)
		zipFileName := fmt.Sprintf("%s_%s", submission.Student.Username, safeFileName)
		
		zipFile, err := zipWriter.Create(zipFileName)
		if err != nil {
			fmt.Printf("Error creating zip entry for %s: %v\n", zipFileName, err)
			continue
		}
		
		_, err = zipFile.Write(fileBytes)
		if err != nil {
			fmt.Printf("Error writing to zip entry %s: %v\n", zipFileName, err)
			continue
		}
		
		fileCount++
	}
	
	err = zipWriter.Close()
	if err != nil {
		return nil, errors.New("failed to create zip file")
	}
	
	if fileCount == 0 {
		return nil, errors.New("no attachments found for this assignment")
	}
	
	return zipBuffer.Bytes(), nil
}

func sanitizeFileName(fileName string) string {
	// Replace path separators and other unsafe characters
	unsafeChars := []string{"\\", "/", ":", "*", "?", "\"", "<", ">", "|"}
	sanitized := fileName
	for _, char := range unsafeChars {
		sanitized = strings.ReplaceAll(sanitized, char, "_")
	}
	return sanitized
}