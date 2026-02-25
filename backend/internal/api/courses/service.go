package course

import (
	"errors"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"strings"
	"gorm.io/gorm"

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

func CreateCourse(userID string, form models.CourseForm) (*models.ResponseCourse, error) {
	course := models.Course{
		ID:         generateCourseID(),
		Name:       form.Name,
		CourseDate: form.CourseDate,
		Section:    form.Section,
		Semester:   form.Semester,
		TeacherID:  userID,
	}

	if err := database.DB.Create(&course).Error; err != nil {
		return nil, err
	}

	response := models.ConvertCourseToResponse(course)

	return &response, nil
}

func UpdateCourse(
	course models.Course,
	form models.CourseForm,
) (*models.ResponseCourse, error) {

	updates := make(map[string]interface{})

	if form.Name != "" {
		updates["name"] = form.Name
	}

	if form.CourseDate != "" {
		updates["course_date"] = form.CourseDate
	}

	if form.Section != "" {
		updates["section"] = form.Section
	}

	if form.Semester != "" {
		updates["semester"] = form.Semester
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&course).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	if err := database.DB.First(&course, "id = ?", course.ID).Error; err != nil {
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
			Status:    "joined",
			StudentID: userID,
			Student:   user,
			CourseID:  course.ID,
			Course:    *course,
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
		"status": true,
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

func CreateAssignment(
	courseID,
	userID string,
	form *models.AssignmentForm,
	file *multipart.FileHeader,
) (*models.ResponseAssignment, error) {
	var attachment *models.Attachment

	switch {
	// CASE 1: use existing attachment
	case form.Attachment != "":
		var existing models.Attachment
		if err := database.DB.
			Where("id = ? AND user_id = ?", form.Attachment, userID).
			First(&existing).
			Error; err != nil {

			return nil, errors.New("invalid attachment id")
		}
		attachment = &existing

	// CASE 2: upload new file
	case file != nil:
		src, err := file.Open()
		if err != nil {
			return nil, err
		}
		defer src.Close()

		data, err := io.ReadAll(src)
		if err != nil {
			return nil, err
		}

		fileKey, err := database.UploadFileToS3(data, file.Filename)
		if err != nil {
			return nil, fmt.Errorf("upload failed: %v", err)
		}

		fileURL := fmt.Sprintf(
			"https://%s.s3.amazonaws.com/%s",
			database.BucketName,
			fileKey,
		)

		newAttachment := models.Attachment{
			FileName: file.Filename,
			FileKey:  fileKey,
			URL:      fileURL,
			UserID:   userID,
		}

		if err := database.DB.Create(&newAttachment).Error; err != nil {
			return nil, err
		}

		attachment = &newAttachment

	// CASE 3: no attachment at all (VALID)
	default:
		attachment = nil
	}

	assignment := models.Assignment{
		CourseID:    courseID,
		Title:       form.Title,
		Description: form.Description,
		Point:       form.Point,
		StartDate:   form.StartDate,
		DueDate:     form.DueDate,
		CloseDate:   form.CloseDate,
		CreatedBy:   userID,
	}

	if attachment != nil {
		assignment.AttachmentID = &attachment.ID
	}

	if len(form.Tags) > 0 {
		tagNames := form.Tags
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

func GetAssignment(idStr, role, assignmentID string) (*models.ResponseDetailedAssignment, error) {
	var assignment models.Assignment
	var submissions []models.Submission

	assignmentQuery := database.DB.
		Preload("Tags").
		Preload("Attachment")

	if role == "student" {
		assignmentQuery = assignmentQuery.Where("visible = ?", true)
	}

	if err := assignmentQuery.
		First(&assignment, "id = ?", assignmentID).
		Error; err != nil {
		return nil, err
	}

	submissionQuery := database.DB.
		Where("assignment_id = ?", assignmentID).
		Preload("Attachment").
		Preload("Submitter")

	if role == "student" {
		submissionQuery = submissionQuery.Preload("Comments", "visible = ?", true)
	} else {
		submissionQuery = submissionQuery.Preload("Comments")
	}

	if role == "student" {
		if err := submissionQuery.
			Where("created_by = ?", idStr).
			Find(&submissions).
			Error; err != nil {
			return nil, err
		}
	} else {
		if err := submissionQuery.
			Find(&submissions).
			Error; err != nil {
			return nil, err
		}
	}

	response := models.ConvertDetailedAssignmentToResponse(assignment, &submissions)

	return &response, nil
}

func UpdateAssignment(
	assignment models.Assignment,
	form models.AssignmentForm,
	file *multipart.FileHeader,
	userID string,
) (*models.ResponseAssignment, error) {

	updates := map[string]interface{}{}

	if form.Title != "" {
		updates["title"] = form.Title
	}
	if form.Description != "" {
		updates["description"] = form.Description
	}
	if form.Point > 0 {
		updates["point"] = form.Point
	}
	if !form.StartDate.IsZero() {
		updates["start_date"] = form.StartDate
	}
	if !form.DueDate.IsZero() {
		updates["due_date"] = form.DueDate
	}
	if !form.CloseDate.IsZero() {
		updates["close_date"] = form.CloseDate
	}
	if form.Visible != nil {
		updates["visible"] = *form.Visible
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&assignment).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	switch {
	// CASE 1: remove attachment
	case form.Attachment == "null" && file == nil:
		if err := database.DB.Model(&assignment).
			Update("attachment_id", nil).Error; err != nil {
			return nil, err
		}

	// CASE 2: use existing attachment
	case form.Attachment != "" && form.Attachment != "null" && file == nil:
		var attachment models.Attachment
		if err := database.DB.
			Where("id = ? AND user_id = ?", form.Attachment, userID).
			First(&attachment).
			Error; err != nil {

			return nil, errors.New("invalid attachment id")
		}

		if err := database.DB.Model(&assignment).
			Update("attachment_id", attachment.ID).Error; err != nil {
			return nil, err
		}

	// CASE 3: upload new file (highest priority)
	case file != nil:
		src, err := file.Open()
		if err != nil {
			return nil, err
		}
		defer src.Close()

		data, err := io.ReadAll(src)
		if err != nil {
			return nil, err
		}

		fileKey, err := database.UploadFileToS3(data, file.Filename)
		if err != nil {
			return nil, err
		}

		fileURL := fmt.Sprintf(
			"https://%s.s3.amazonaws.com/%s",
			database.BucketName,
			fileKey,
		)

		newAttachment := models.Attachment{
			FileName: file.Filename,
			FileKey:  fileKey,
			URL:      fileURL,
			UserID:   userID,
		}

		if err := database.DB.Create(&newAttachment).Error; err != nil {
			return nil, err
		}

		if err := database.DB.Model(&assignment).
			Update("attachment_id", newAttachment.ID).Error; err != nil {
			return nil, err
		}
	// CASE 4: empty string → do nothing
	default:
		// no change
	}

	if form.Tags != nil {
		if len(form.Tags) > 5 {
			form.Tags = form.Tags[:5]
		}

		var cleaned []string
		for _, t := range form.Tags {
			if name := strings.TrimSpace(t); name != "" {
				cleaned = append(cleaned, name)
			}
		}

		var tags []models.Tag
		if len(cleaned) > 0 {
			var existing []models.Tag
			if err := database.DB.Where("name IN ?", cleaned).
				Find(&existing).Error; err != nil {
				return nil, err
			}

			existingMap := map[string]models.Tag{}
			for _, t := range existing {
				existingMap[t.Name] = t
			}

			for _, name := range cleaned {
				if t, ok := existingMap[name]; ok {
					tags = append(tags, t)
				} else {
					newTag := models.Tag{Name: name}
					if err := database.DB.Create(&newTag).Error; err != nil {
						return nil, err
					}
					tags = append(tags, newTag)
				}
			}
		}

		if err := database.DB.Model(&assignment).
			Association("Tags").
			Replace(tags); err != nil {
			return nil, err
		}
	}

	if err := database.DB.
		Preload("Tags").
		Preload("Attachment").
		First(&assignment, "id = ?", assignment.ID).
		Error; err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentToResponse(assignment)
	return &response, nil
}

func CreateSubmission(
	assignmentID,
	userID string,
	form *models.SubmissionForm,
	file *multipart.FileHeader,
) (*models.ResponseSubmission, error) {
	var attachment *models.Attachment

	switch {
	// CASE 1: use existing attachment
	case form.Attachment != "":
		var existing models.Attachment
		if err := database.DB.
			Where("id = ? AND user_id = ?", form.Attachment, userID).
			First(&existing).
			Error; err != nil {

			return nil, errors.New("invalid attachment id")
		}
		attachment = &existing

	// CASE 2: upload new file
	case file != nil:
		src, err := file.Open()
		if err != nil {
			return nil, err
		}
		defer src.Close()

		data, err := io.ReadAll(src)
		if err != nil {
			return nil, err
		}

		fileKey, err := database.UploadFileToS3(data, file.Filename)
		if err != nil {
			return nil, fmt.Errorf("upload failed: %v", err)
		}

		fileURL := fmt.Sprintf(
			"https://%s.s3.amazonaws.com/%s",
			database.BucketName,
			fileKey,
		)

		newAttachment := models.Attachment{
			FileName: file.Filename,
			FileKey:  fileKey,
			URL:      fileURL,
			UserID:   userID,
		}

		if err := database.DB.Create(&newAttachment).Error; err != nil {
			return nil, err
		}

		attachment = &newAttachment

	// CASE 3: no attachment at all (VALID)
	default:
		attachment = nil
	}

	submission := models.Submission{
		AssignmentID: assignmentID,
		Answer:       form.Answer,
		CreatedBy:    userID,
	}

	if attachment != nil {
		submission.AttachmentID = &attachment.ID
	}

	if err := database.DB.Create(&submission).Error; err != nil {
		return nil, err
	}

	response := models.ConvertSubmissionToResponse(submission)

	return &response, nil
}

func UpdateSubmission(
	submission models.Submission,
	form models.SubmissionForm,
	file *multipart.FileHeader,
	userID string,
) (*models.ResponseSubmission, error) {

	updates := map[string]interface{}{}

	if form.Answer != "" {
		updates["answer"] = form.Answer
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&submission).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	switch {
	// CASE 1: remove attachment
	case form.Attachment == "null" && file == nil:
		if err := database.DB.Model(&submission).
			Update("attachment_id", nil).Error; err != nil {
			return nil, err
		}

	// CASE 2: use existing attachment
	case form.Attachment != "" && form.Attachment != "null" && file == nil:
		var attachment models.Attachment
		if err := database.DB.
			Where("id = ? AND user_id = ?", form.Attachment, userID).
			First(&attachment).
			Error; err != nil {

			return nil, errors.New("invalid attachment id")
		}

		if err := database.DB.Model(&submission).
			Update("attachment_id", attachment.ID).Error; err != nil {
			return nil, err
		}

	// CASE 3: upload new file (highest priority)
	case file != nil:
		src, err := file.Open()
		if err != nil {
			return nil, err
		}
		defer src.Close()

		data, err := io.ReadAll(src)
		if err != nil {
			return nil, err
		}

		fileKey, err := database.UploadFileToS3(data, file.Filename)
		if err != nil {
			return nil, err
		}

		fileURL := fmt.Sprintf(
			"https://%s.s3.amazonaws.com/%s",
			database.BucketName,
			fileKey,
		)

		newAttachment := models.Attachment{
			FileName: file.Filename,
			FileKey:  fileKey,
			URL:      fileURL,
			UserID:   userID,
		}

		if err := database.DB.Create(&newAttachment).Error; err != nil {
			return nil, err
		}

		if err := database.DB.Model(&submission).
			Update("attachment_id", newAttachment.ID).Error; err != nil {
			return nil, err
		}
	// CASE 4: empty string → do nothing
	default:
		// no change
	}

	if err := database.DB.
		Preload("Attachment").
		First(&submission, "id = ?", submission.ID).
		Error; err != nil {
		return nil, err
	}

	response := models.ConvertSubmissionToResponse(submission)
	return &response, nil
}

func CreateOrUpdateComment(
	submission *models.Submission,
	userID,
	role string,
	form *models.CommentForm,
) (*models.ResponseComment, error) {
	var existingComment models.Comment
	err := database.DB.
		Where("submission_id = ? AND created_by = ?", submission.ID, userID).
		First(&existingComment).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}

	var comment *models.Comment

	if err == gorm.ErrRecordNotFound {
		comment = &models.Comment{
			SubmissionID:  submission.ID,
			Comment:       form.Comment,
			CreatedByRole: models.Role(role),
			CreatedBy:     userID,
			Visible:       form.Visible,
		}

		if err := database.DB.Create(comment).Error; err != nil {
			return nil, err
		}

	} else {
		existingComment.Comment = form.Comment
		existingComment.CreatedByRole = models.Role(role)
		existingComment.Visible = form.Visible

		if err := database.DB.Save(&existingComment).Error; err != nil {
			return nil, err
		}

		comment = &existingComment
	}

	response := models.ResponseComment{
		ID:        comment.ID,
		Comment:   comment.Comment,
		CreatedBy: role,
		Visible:   comment.Visible,
	}

	return &response, nil
}

func ToggleComment(
	comment *models.Comment,
	role string,
) (*models.ResponseComment, error) {

	newVisible := !comment.Visible

	updates := map[string]interface{}{
		"visible": newVisible,
	}
	
	if string(comment.CreatedByRole) == role || role == "teacher" {
		if err := database.DB.Model(comment).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	if err := database.DB.First(comment, "id = ?", comment.ID).Error; err != nil {
		return nil, err
	}

	response := models.ResponseComment{
		ID:        comment.ID,
		Comment:   comment.Comment,
		CreatedBy: string(comment.CreatedByRole),
		Visible:   comment.Visible,
	}

	return &response, nil
}

