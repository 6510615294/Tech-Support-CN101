package course

import (
	"errors"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"strings"

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

func GetCourses(userID, userRole string) (*[]models.ResponseCourse, error) {
	var courses []models.Course
	var err error

	switch userRole {
	case "student":
		err = database.DB.Joins("JOIN enrollments ON enrollments.course_id = courses.id").
			Where("enrollments.student_id = ?", userID).
			Preload("Teacher").
			Find(&courses).Error

	case "teacher":
		err = database.DB.Where("teacher_id = ?", userID).
			Preload("Teacher").
			Find(&courses).Error

	default:
		return nil, fmt.Errorf("unsupported role: %s", userRole)
	}

	if err != nil {
		return nil, err
	}

	response := models.ConvertCoursesToResponse(courses)

	return &response, nil
}

func GetCourse(courseID string) (*models.ResponseCourse, error) {
	var course models.Course

	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return nil, err
	}

	response := models.ConvertCourseToResponse(course)

	return &response, nil
}

func CreateCourse(userID string, input models.Course) (*models.ResponseCourse, error) {
	input.TeacherID = userID

	if input.ID == "" {
		input.ID = generateCourseID()
	}

	if err := database.DB.Create(&input).Error; err != nil {
		return nil, err
	}

	response := models.ConvertCourseToResponse(input)

	return &response, nil
}

func UpdateCourse(course models.Course, input map[string]interface{}) (*models.ResponseCourse, error) {
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

	response := models.ConvertCourseToResponse(course)

	return &response, nil
}

func JoinCourse(userID string, course *models.Course) (*models.ResponseEnrollment, error) {
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

		response := models.ConvertEnrollmentToResponse(enrollment)

		return &response, nil
		
	default:
		return nil, fmt.Errorf("unsupported role: %s", user.Role)
	}
}

// TODO : change response
func GetStudents(courseID string) ([]models.StudentWithEnrollment, error) {
    var results []models.StudentWithEnrollment
    
    err := database.DB.
        Model(&models.User{}).
        Select("users.*, enrollments.status as status").
        Joins("JOIN enrollments ON enrollments.student_id = users.id").
        Where("enrollments.course_id = ?", courseID).
        Find(&results).Error

    if err != nil {
        return nil, err
    }

    return results, nil
}

// TODO : change response
func ChangeStudentStatus(courseID, studentID string, input map[string]interface{}) (*models.Enrollment, error) {
	allowedFields := map[string]bool{
		"status": 		true,
	}

	updates := make(map[string]interface{})
	for key, value := range input {
		if allowedFields[key] {
			updates[key] = value
		}
	}

	var enrollment models.Enrollment
	if err := database.DB.First(&enrollment, "course_id = ? AND student_id = ?", courseID, studentID).Error; err != nil {
		return nil, err
	}

	if err := database.DB.Model(&enrollment).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &enrollment, nil
}

func CreateAssignment(courseID, userID string, input *models.AssignmentInput, file *multipart.FileHeader) (*models.ResponseAssignment, error) {
	var fileKey, fileURL string
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}

	var attachment models.Attachment

	if input.Attachment != "" {
		if err := database.DB.First(&attachment, "id = ?", input.Attachment).Error; err != nil {
			return nil, errors.New("invalid existing file id")
		}

	} else {
		if file == nil {
			return nil, errors.New("file is required or existing_file_id must be provided")
		}

		src, err := file.Open()
		if err != nil {
			return nil, err
		}
		defer src.Close()

		fileBytes, err := io.ReadAll(src)
		if err != nil {
			return nil, err
		}

		fileKey, err = database.UploadFileToS3(fileBytes, file.Filename)
		if err != nil {
			return nil, fmt.Errorf("upload failed: %v", err)
		}

		fileURL = fmt.Sprintf("https://%s.s3.amazonaws.com/%s", database.BucketName, fileKey)
		attachment = models.Attachment{
			FileName: 	file.Filename,
			FileKey:  	fileKey,
			URL:  		fileURL,
			UserID:   	userID,
			Uploader: 	user,
		}
		if err := database.DB.Create(&attachment).Error; err != nil {
			return nil, err
		}
	}

	assignment := models.Assignment{
		CourseID:    courseID,
		Title:       input.Title,
		Description: input.Description,
		Point:       input.Point,
		StartDate:   input.StartDate,
		DueDate:     input.DueDate,
		CloseDate:   input.CloseDate,
		AttachmentID: attachment.ID,
		Attachment:  attachment,
		CreatedBy:   userID,
	}

	if len(input.Tags) > 0 {
		tagNames := input.Tags
		if len(tagNames) > 5 {
			tagNames = tagNames[:5]
		}

		var cleanedNames []string
		for _, t := range tagNames {
			name := strings.TrimSpace(t)
			if name != "" {
				cleanedNames = append(cleanedNames, name)
			}
		}

		if len(cleanedNames) > 0 {
			var existingTags []models.Tag

			if err := database.DB.Where("name IN ?", cleanedNames).Find(&existingTags).Error; err != nil {
				return nil, err
			}

			existingMap := make(map[string]models.Tag)
			for _, tag := range existingTags {
				existingMap[tag.Name] = tag
			}

			var assignmentTags []models.Tag

			for _, name := range cleanedNames {
				if existingTag, ok := existingMap[name]; ok {
					assignmentTags = append(assignmentTags, existingTag)
				} else {
					newTag := models.Tag{Name: name}
					if err := database.DB.Create(&newTag).Error; err != nil {
						return nil, err
					}
					assignmentTags = append(assignmentTags, newTag)
				}
			}

			assignment.Tags = assignmentTags
		}
	}

	if err := database.DB.Create(&assignment).Error; err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentToResponse(assignment)

	return &response, nil
}

func GetAssignments(courseID string) (*[]models.ResponseAssignment, error) {
    var assignments []models.Assignment

    if err := database.DB.Preload("Tags").Find(&assignments, "course_id = ?", courseID).Error; err != nil {
        return nil, err
    }

	response := models.ConvertAssignmentsToResponse(assignments)

    return &response, nil
}

func GetAssignment(assignmentID string) (*models.ResponseAssignment, error) {
    var assignment models.Assignment

    if err := database.DB.Preload("Tags").First(&assignment, "id = ?", assignmentID).Error; err != nil {
        return nil, err
    }

	response := models.ConvertAssignmentToResponse(assignment)

    return &response, nil
}