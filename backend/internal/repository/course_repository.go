package repository

import (
	stderrors "errors"
	"gorm.io/gorm"
	
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateCourseWithMember(
	course *models.Course,
	member *models.CourseMember,
) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(course).Error; err != nil {
			return err
		}

		if err := tx.Create(member).Error; err != nil {
			return err
		}

		return nil
	})
}

func GetAllCourses() ([]models.Course, error) {

	var courses []models.Course

	err := database.DB.Find(&courses).Error
	return courses, err
}

func GetCoursesByUser(userID string) ([]models.Course, error) {

	var courses []models.Course

	err := database.DB.
		Joins("JOIN course_members ON course_members.course_id = courses.id").
		Where("course_members.user_id = ?", userID).
		Find(&courses).Error

	return courses, err
}

func GetCourseByID(courseID string) (*models.Course, error) {
	var course models.Course

	err := database.DB.
		First(&course, "id = ?", courseID).
		Error

	if stderrors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.ErrCourseNotFound
	}
	return &course, nil
}

func UpdateCourse(courseID string, updates map[string]any) error {
	return database.DB.
		Model(&models.Course{}).
		Where("id = ?", courseID).
		Updates(updates).
		Error
}

func DeleteCourse(courseID string) error {
	return database.DB.
		Delete(&models.Course{}, "id = ?", courseID).
		Error
}