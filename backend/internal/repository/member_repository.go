package repository

import (
	stderrors "errors"

	"gorm.io/gorm"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateCourseMember(member *models.CourseMember) error {
	return database.DB.Create(member).Error
}

func GetActiveStudents(courseID string) ([]models.CourseMember, error) {
	var courseMembers []models.CourseMember

	err := database.DB.
		Joins("User").
		Where("course_members.course_id = ?", courseID).
		Where("course_members.role = ?", "student").
		Where("course_members.status = ?", "active").
		Find(&courseMembers).Error

	return courseMembers, err
}

func GetCourseMembers(courseID string) ([]models.CourseMember, error) {
	var members []models.CourseMember

	err := database.DB.
		Where("course_id = ?", courseID).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, en_name, th_name, email")
		}).
		Find(&members).
		Error

	return members, err
}

func GetCourseMember(courseID, memberID string) (*models.CourseMember, error) {

	var member models.CourseMember

	err := database.DB.
		Where("course_id = ? AND user_id = ?", courseID, memberID).
		First(&member).Error

	if err != nil {
		return nil, err
	}

	return &member, nil
}

func IsUserInCourse(userID, courseID string) (bool, error) {
	var member models.CourseMember

	err := database.DB.
		Where("user_id = ? AND course_id = ?", userID, courseID).
		First(&member).Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return true, nil
}

func UpdateCourseMember(courseID, memberID string, updates map[string]any) (*models.CourseMember, error) {
	var member models.CourseMember

	err := database.DB.
		Model(&models.CourseMember{}).
		Where("course_id = ? AND user_id = ?", courseID, memberID).
		Updates(updates).Error

	if err != nil {
		return nil, err
	}

	err = database.DB.
		Where("course_id = ? AND user_id = ?", courseID, memberID).
		Preload("User").
		First(&member).Error

	if err != nil {
		return nil, err
	}

	return &member, nil
}

func DeleteCourseMember(courseID, memberID string) error {
	return database.DB.
		Where("course_id = ? AND user_id = ?", courseID, memberID).
		Delete(&models.CourseMember{}).Error
}

// GetUserCourseIDs returns all course IDs where the user is a member
func GetUserCourseIDs(userID string) ([]string, error) {
	var courseIDs []string

	err := database.DB.
		Model(&models.CourseMember{}).
		Where("user_id = ? AND status = ?", userID, "active").
		Pluck("course_id", &courseIDs).
		Error

	return courseIDs, err
}

// HasNonStudentRoleInCourse checks if user has any role other than "student" in the specified course
func HasNonStudentRoleInCourse(userID, courseID string) (bool, error) {
	var count int64

	err := database.DB.
		Model(&models.CourseMember{}).
		Where("user_id = ? AND course_id = ? AND role != ?", userID, courseID, "student").
		Count(&count).
		Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}
