package repository

import (
	stderrors "errors"

	"gorm.io/gorm"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateAssignment(assignment *models.Assignment) error {
	return database.DB.Create(assignment).Error
}

func GetAssignment(courseID, assignmentID string) (*models.Assignment, error) {
	var assignment models.Assignment

	err := database.DB.
		Where("course_id = ? AND id = ?", courseID, assignmentID).
		First(&assignment).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrAssignmentNotFound
	}

	return &assignment, err
}

func GetAssignmentWithRelations(courseID, assignmentID string) (*models.Assignment, error) {
	var assignment models.Assignment

	err := database.DB.
		Preload("Tags").
		Preload("Attachments").
		Where("course_id = ?", courseID).
		First(&assignment, "id = ?", assignmentID).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrAssignmentNotFound
	}

	return &assignment, err
}

func GetAssignmentMaxPoint(assignmentID string) (*int16, error) {
	var assignment models.Assignment

	err := database.DB.
		Where("id = ?", assignmentID).
		First(&assignment).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrAssignmentNotFound
	}

	return &assignment.Point, err
}

func GetVisibleAssignment(courseID, assignmentID string) (*models.Assignment, error) {
	var assignment models.Assignment

	err := database.DB.
		Preload("Tags").
		Preload("Attachments").
		Where("course_id = ? AND visible = ?", courseID, true).
		First(&assignment, "id = ?", assignmentID).
		Error

	return &assignment, err
}

func GetAssignmentsByCourse(courseID string) ([]models.Assignment, error) {
	var assignments []models.Assignment

	err := database.DB.
		Preload("Tags").
		Where("course_id = ?", courseID).
		Find(&assignments).
		Error

	return assignments, err
}

func GetVisibleAssignments(courseID string) ([]models.Assignment, error) {
	var assignments []models.Assignment

	err := database.DB.
		Preload("Tags").
		Where("course_id = ? AND visible = ?", courseID, true).
		Find(&assignments).
		Error

	return assignments, err
}

func UpdateAssignment(id string, updates map[string]any) error {
	return database.DB.
		Model(&models.Assignment{}).
		Where("id = ?", id).
		Updates(updates).
		Error
}

func DeleteAssignment(assignment *models.Assignment) error {
	return database.DB.Delete(assignment).Error
}

func CreateAssignmentOverride(
	override *models.AssignmentOverride,
) (*models.AssignmentOverride, error) {

	if err := database.DB.Create(override).Error; err != nil {
		return nil, err
	}

	return override, nil
}

func CreateAssignmentPrompt(
	prompt *models.AssignmentPrompt,
) (*models.AssignmentPrompt, error) {

	if err := database.DB.Create(prompt).Error; err != nil {
		return nil, err
	}

	return prompt, nil
}

func GetAssignmentPrompt(assignmentID string) (*models.AssignmentPrompt, error) {
	var prompt models.AssignmentPrompt

	err := database.DB.
		Where("assignment_id = ?", assignmentID).
		First(&prompt).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrAssignmentNotFound
	}

	return &prompt, err
}

func GetAssignmentPromptByCourseID(courseID, assignmentID string) (*models.AssignmentPrompt, error) {
	var prompt models.AssignmentPrompt

	err := database.DB.
		Joins("JOIN assignments ON assignments.id = assignment_prompts.assignment_id").
		Where("assignments.course_id = ? AND assignment_prompts.assignment_id = ?", courseID, assignmentID).
		First(&prompt).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrAssignmentNotFound
	}

	return &prompt, err
}

func UpdateAssignmentPrompt(id string, updates map[string]any) error {
	return database.DB.
		Model(&models.AssignmentPrompt{}).
		Where("id = ?", id).
		Updates(updates).
		Error
}

func GetOverridesByStudent(userID string) ([]models.AssignmentOverride, error) {
	var overrides []models.AssignmentOverride

	err := database.DB.
		Where("student_id = ?", userID).
		Find(&overrides).
		Error

	return overrides, err
}

func GetAssignmentOverride(assignmentID, userID string) (*models.AssignmentOverride, error) {

	var o models.AssignmentOverride

	err := database.DB.
		Where("assignment_id = ? AND student_id = ?", assignmentID, userID).
		Take(&o).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}

	return &o, err
}
