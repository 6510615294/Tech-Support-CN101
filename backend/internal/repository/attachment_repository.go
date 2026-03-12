package repository

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateAttachment(attachment *models.Attachment) error {
	return database.DB.Create(attachment).Error
}

func ReplaceAssignmentAttachments(id string, attachments []models.Attachment,) error {
	return database.DB.
		Model(&models.Assignment{ID: id}).
		Association("Attachments").
		Replace(attachments)
}

func GetAttachmentsByIDs(userID string, attachmentIDs  []string) ([]models.Attachment, error) {
	var existingAttachments []models.Attachment

	err := database.DB.
		Where("id IN ? AND user_id = ?", attachmentIDs, userID).
		Find(&existingAttachments).
		Error
	
	return existingAttachments, err
}