package repository

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func ReplaceAssignmentTags(id string, tags []models.Tag) error {
	return database.DB.
		Model(&models.Assignment{ID: id}).
		Association("Tags").
		Replace(tags)
}

func ReplaceAssignmentTemplateTags(id string, tags []models.Tag) error {
	return database.DB.
		Model(&models.AssignmentTemplate{ID: id}).
		Association("Tags").
		Replace(tags)
}

func CreateTag(tag *models.Tag) error {
	return database.DB.Create(tag).Error
}

func FindTags(names []string) ([]models.Tag, error) {
	var existingTags []models.Tag

	err := database.DB.Where("name IN ?", names).Find(&existingTags).Error

	return existingTags, err
}
