package repository

import (
	stderrors "errors"
	"time"

	"gorm.io/gorm"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateAIConfig(config *models.AIConfig) error {
	return database.DB.Create(config).Error
}

func GetAIConfig(userID string) (*models.AIConfig, error) {
	var config *models.AIConfig

	err := database.DB.
		Where("user_id = ?", userID).
		First(&config).Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrAIConfigNotFound
	}

	return config, err
}

func GetAIConfigByID(id string) (*models.AIConfig, error) {
	var config *models.AIConfig

	err := database.DB.
		Where("id = ?", id).
		First(&config).Error

	return config, err
}

func UpdateAIConfig(userID string, updates map[string]any) error {
	return database.DB.
		Model(&models.AIConfig{}).
		Where("user_id = ?", userID).
		Updates(updates).
		Error
}

func DeleteAIConfig(userID string) error {
	return database.DB.
		Delete(&models.Course{}, "user_id = ?", userID).
		Error
}

func CreateGradingJob(assignmentID, teacherID string) error {
	gradingJob := models.GradingJob{
		AssignmentID: assignmentID,
		TeacherID:    teacherID,
	}

	return database.DB.Create(&gradingJob).Error
}

func GetGradingJob(assignmentID, teacherID string) (*models.GradingJob, error) {
	var gradingJob models.GradingJob

	err := database.DB.
		Where("assignment_id = ? AND teacher_id = ? AND status != ?", assignmentID, teacherID, "complete").
		First(&gradingJob).Error

	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &gradingJob, nil
}

func ResetGradingJob(gradingJobID string) error {
	return database.DB.Model(&models.GradingJob{}).
		Where("id = ?", gradingJobID).
		Updates(map[string]any{
			"status":                models.JobPending,
			"progress":              0,
			"processed_submissions": 0,
			"total_submissions":     0,
			"error":                 "",
			"started_at":            nil,
			"completed_at":          nil,
		}).Error
}

func GradingJobStart(assignmentID, teacherID string, total int) error {
	now := time.Now()

	return database.DB.Model(&models.GradingJob{}).
		Where("assignment_id = ? AND teacher_id = ?", assignmentID, teacherID).
		Updates(map[string]any{
			"status":            models.JobProcessing,
			"total_submissions": int16(total),
			"started_at":        &now,
		}).Error
}

func UpdateGradingJob(assignmentID, teacherID string, progress, processedSubmissions int) error {
	return database.DB.Model(&models.GradingJob{}).
		Where("assignment_id = ? AND teacher_id = ?", assignmentID, teacherID).
		Updates(map[string]any{
			"progress":              progress,
			"processed_submissions": processedSubmissions,
		}).Error
}
func CompleteGradingJob(assignmentID, teacherID string) error {
	now := time.Now()

	return database.DB.Model(&models.GradingJob{}).
		Where("assignment_id = ? AND teacher_id = ?", assignmentID, teacherID).
		Updates(map[string]any{
			"status":       models.JobCompleted,
			"progress":     100,
			"completed_at": &now,
		}).Error
}

func FailGradingJob(assignmentID, teacherID string, errorMsg string) error {
	return database.DB.Model(&models.GradingJob{}).
		Where("assignment_id = ? AND teacher_id = ?", assignmentID, teacherID).
		Updates(map[string]any{
			"status": models.JobFailed,
			"error":  errorMsg,
		}).Error
}

func GetGradingJobsByTeacher(teacherID string) ([]models.GradingJob, error) {
	var gradingJobs []models.GradingJob

	err := database.DB.
		Preload("Assignment").
		Where("teacher_id = ?", teacherID).
		Order("created_at DESC").
		Find(&gradingJobs).Error

	return gradingJobs, err
}

func GetGradingJobByID(gradingJobID, teacherID string) (*models.GradingJob, error) {
	var gradingJob models.GradingJob

	err := database.DB.
		Preload("Assignment").
		Preload("Teacher").
		Where("id = ? AND teacher_id = ?", gradingJobID, teacherID).
		First(&gradingJob).Error

	if err != nil {
		if stderrors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &gradingJob, nil
}

func DeleteGradingJob(gradingJobID, teacherID string) error {
	return database.DB.
		Where("id = ? AND teacher_id = ?", gradingJobID, teacherID).
		Delete(&models.GradingJob{}).Error
}
