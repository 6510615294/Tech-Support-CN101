package repository

import (
	stderrors "errors"
	"gorm.io/gorm"
	
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateComment(comment *models.Comment) (*models.Comment, error) {
	if err := database.DB.Create(comment).Error; err != nil {
		return nil, err
	}

	return comment, nil
}

func GetCommentByIDAndCourse(
	commentID string,
	submissionID string,
	courseID string,
) (*models.Comment, error) {

	var comment models.Comment

	err := database.DB.
		Joins("JOIN submissions ON submissions.id = comments.submission_id").
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Where(`
			comments.id = ?
			AND submissions.id = ?
			AND assignments.course_id = ?
		`, commentID, submissionID, courseID).
		First(&comment).Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrCommentNotFound
	}

	return &comment, err
}

func GetCommentBySubmissionAndUser(submissionID, userID string) (*models.Comment, error) {
	var comment models.Comment

	err := database.DB.
		Where("submission_id = ? AND created_by = ?", submissionID, userID).
		First(&comment).Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrCommentNotFound
	}

	return &comment, err
}

func UpdateComment(comment *models.Comment) error {
	return database.DB.Save(comment).Error
}