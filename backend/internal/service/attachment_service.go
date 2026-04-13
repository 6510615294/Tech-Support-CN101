package service

import (
	"fmt"
	"io"
	"mime/multipart"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
)

func stringifyValue(v interface{}) string {
	switch val := v.(type) {
	case string:
		return val
	case []byte:
		return string(val)
	default:
		return fmt.Sprint(val)
	}
}

func CreateAttachments(
	userID string,
	files []*multipart.FileHeader,
) error {
	if len(files) > 5 {
		return errors.ErrTooManyAttachments
	}

	for _, file := range files {

		src, err := file.Open()
		if err != nil {
			return err
		}

		data, _ := io.ReadAll(src)
		src.Close()

		fileKey, err := database.UploadFileToS3(data, file.Filename)
		if err != nil {
			return err
		}

		att := models.Attachment{
			FileName: file.Filename,
			FileType: file.Header.Get("Content-Type"),
			FileKey:  fileKey,
			Size:     file.Size,
			UserID:   userID,
		}

		if err := repository.CreateAttachment(&att); err != nil {
			return err
		}
	}

	return nil
}

func GetAttachments(userID string) (*[]models.ResponseAttachment, error) {
	attachments, err := repository.GetAttachments(userID)
	if err != nil {
		return nil, err
	}

	response := models.ConvertAttachmentsToResponse(attachments)

	return &response, nil
}

func DownloadAttachment(userID, attachmentID string) ([]byte, string, string, error) {
	attachment, err := repository.GetAttachment(userID, attachmentID)
	if err != nil {
		return nil, "", "", err
	}

	fileBytes, err := database.DownloadFileFromS3ByKey(attachment.FileKey)
	if err != nil {
		return nil, "", "", err
	}

	return fileBytes, attachment.FileName, attachment.FileType, nil
}

func DeleteAttachment(userID, attachmentID string) error {
	attachment, err := repository.GetAttachment(userID, attachmentID)
	if err != nil {
		return err
	}

	if err := repository.DeleteAttachment(attachment); err != nil {
		return err
	}

	return nil
}

func GetAttachmentDetail(userID, attachmentID string) (*models.ResponseAttachmentDetail, error) {
	// Verify the attachment exists and belongs to the user
	_, err := repository.GetAttachment(userID, attachmentID)
	if err != nil {
		return nil, err
	}

	// Get assignments that use this attachment
	assignments, err := repository.GetAssignmentsByAttachmentID(attachmentID)
	if err != nil {
		return nil, err
	}

	// Get templates that use this attachment
	templates, err := repository.GetTemplatesByAttachmentID(attachmentID)
	if err != nil {
		return nil, err
	}

	// Format assignments as "Title (Course ID)"
	relatedAssignments := make([]string, len(assignments))
	for i, a := range assignments {
		title := stringifyValue(a["title"])
		courseID := stringifyValue(a["course_id"])
		relatedAssignments[i] = fmt.Sprintf("%s (%s)", title, courseID)
	}

	// Format templates as "Title"
	relatedTemplates := make([]string, len(templates))
	for i, t := range templates {
		relatedTemplates[i] = stringifyValue(t["title"])
	}

	response := models.ResponseAttachmentDetail{
		RelatedAssignments: relatedAssignments,
		RelatedTemplates:   relatedTemplates,
	}

	return &response, nil
}
