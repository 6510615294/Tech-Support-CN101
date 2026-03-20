package service

import (
	"io"
	"mime/multipart"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
)

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
			FileKey:  fileKey,
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
