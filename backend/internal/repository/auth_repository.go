package repository

import (
	stderrors "errors"

	"gorm.io/gorm"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateUser(user *models.User) (*models.User, error) {

	if err := database.DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func GetUserByUsername(username string) (*models.User, error) {

	var user models.User

	err := database.DB.
		Where("username = ?", username).
		First(&user).Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrUserNotFound
	}

	return &user, err
}

func GetUserByID(userID string) (*models.User, error) {
	var user models.User

	err := database.DB.
		Where("id = ?", userID).
		First(&user).Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrUserNotFound
	}

	return &user, err
}

func UpdateUser(user *models.User) error {
	return database.DB.Model(user).Updates(map[string]any{
		"th_name":    user.ThName,
		"en_name":    user.EnName,
		"updated_at": user.UpdatedAt,
	}).Error
}
