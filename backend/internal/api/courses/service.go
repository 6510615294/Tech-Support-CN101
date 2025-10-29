package course

import (
	"fmt"
	"math/rand"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func generateCourseID() string {
	const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	id := make([]byte, 6)
	for i := range id {
		id[i] = letters[rand.Intn(len(letters))]
	}
	return string(id)
}

func GetCourse(userID string) ([]models.Course, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	var courses []models.Course

	switch user.Role {
	case "student":
		err := database.DB.Joins("JOIN enrollments ON enrollments.course_id = courses.id").
			Where("enrollments.student_id = ?", userID).
			Find(&courses).Error
		if err != nil {
			return nil, err
		}

	case "teacher":
		err := database.DB.Where("teacher_id = ?", userID).Find(&courses).Error
		if err != nil {
			return nil, err
		}

	default:
		return nil, fmt.Errorf("unsupported role: %s", user.Role)
	}

	return courses, nil
}


func CreateCourse(userID string, input models.Course) (*models.Course, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	input.TeacherID = user.ID

	if input.ID == "" {
		input.ID = generateCourseID()
	}

	if err := database.DB.Create(&input).Error; err != nil {
		return nil, err
	}

	return &input, nil
}

func UpdateCourse(userID, courseID string, input map[string]interface{}) (*models.Course, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	var course models.Course
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return nil, err
	}

	allowedFields := map[string]bool{
		"name":        true,
		"course_date": true,
		"semester":    true,
		"section":     true,
	}

	updates := make(map[string]interface{})
	for key, value := range input {
		if allowedFields[key] {
			updates[key] = value
		}
	}

	if err := database.DB.Model(&course).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &course, nil
}

func JoinCourse(userID string, course *models.Course) (*models.Enrollment, error) {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	switch user.Role {
	case "student":
		enrollment := models.Enrollment{
			Status: "joined",
			StudentID: userID,
			Student: user,
			CourseID:  course.ID,
			Course: *course,
		}

		if err := database.DB.Create(&enrollment).Error; err != nil {
			return nil, err
		}

		return &enrollment, nil
		
	default:
		return nil, fmt.Errorf("unsupported role: %s", user.Role)
	}
}