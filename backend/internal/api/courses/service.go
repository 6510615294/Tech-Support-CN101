package course

import (
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"slices"
	"strings"
	"errors"
	
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
	
	if models.HasPermission(userRole, "course:view_all") {
		err = database.DB.Find(&courses).Error
	} else if models.HasPermission(userRole, "course:view_own") {
		err = database.DB.
			Joins("JOIN course_members ON course_members.course_id = courses.id").
			Where("course_members.user_id = ?", userID).
			Find(&courses).Error
	} else {
		return nil, errors.New("no permission")
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

	response := models.ConvertCourseToResponse(&course)

	return &response, nil
}

func CreateCourse(userID, role string, form *models.CourseForm) (*models.ResponseCourse, error) {
	courseID := generateCourseID()
	course := models.Course{
		ID:         courseID,
		Name:       form.Name,
		CourseDate: form.CourseDate,
		Section:    form.Section,
		Semester:   form.Semester,
		TeacherID:  userID,
	}

	if err := database.DB.Create(&course).Error; err != nil {
		return nil, err
	}
	
	courseMember := models.CourseMember {
		UserID: 	userID,
		CourseID: 	courseID,
		Role: 		role,
		Status: 	"active",
	}
	
	if err := database.DB.Create(&courseMember).Error; err != nil {
		return nil, err
	}

	response := models.ConvertCourseToResponse(&course)

	return &response, nil
}

func UpdateCourse(
	course *models.Course,
	form *models.CourseForm,
) (*models.ResponseCourse, error) {

	updates := make(map[string]any)

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

//o(n) querry (Absolutely 3N)
func EnrollCourse(courseID string, form *models.EnrollmentForms) (*models.ResponseEnrollmentResults, error) {
	results := &models.ResponseEnrollmentResults{
		EnrollmentResult: make([]models.ResponseEnrollmentResult, 0, len(form.UserEnroll)),
	}

	for _, enrollment := range form.UserEnroll {
		result := models.ResponseEnrollmentResult{
			Username: enrollment.Username,
			Role:     enrollment.CourseRole,
			Status:   "Success",
		}

		// Check if user exists
		var user models.User
		if err := database.DB.Where("username = ?", enrollment.Username).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				result.Status = "Need Register"
			} else {
				result.Status = "Error"
			}
			results.EnrollmentResult = append(results.EnrollmentResult, result)
			continue
		}

		// Check if user is already in the course
		var existingMember models.CourseMember
		if err := database.DB.Where("user_id = ? AND course_id = ?", user.ID, courseID).First(&existingMember).Error; err == nil {
			result.Status = "Already In Course"
			results.EnrollmentResult = append(results.EnrollmentResult, result)
			continue
		}

		// Create the course member
		courseMember := models.CourseMember{
			UserID:   user.ID,
			CourseID: courseID,
			Role:     enrollment.CourseRole,
			Status:   "enrolled",
		}
		
		if err := database.DB.Create(&courseMember).Error; err != nil {
			result.Status = "Error"
		}
		
		results.EnrollmentResult = append(results.EnrollmentResult, result)
	}

	return results, nil
}

func GetMember(courseID string) (*[]models.ResponseMember, error) {
	var courseMembers []models.CourseMember
	
	if err := database.DB.Where("course_id = ?", courseID).Preload("User").Find(&courseMembers).Error; err != nil {
		return nil, err
	}

	results := []models.ResponseMember{}
	for _, member := range courseMembers {
		results = append(results, models.ResponseMember{
			UserID:   member.UserID,
			Username: member.User.Username,
			EnName:   member.User.EnName,
			ThName:   member.User.ThName,
			Email:    member.User.Email,
			Status:   member.Status,
			Role:     member.Role,
		})
	}

	return &results, nil
}

func UpdateMember(courseID, memberID string, form *models.UpdateMemberForm) (*models.ResponseMember, error) {
	
	updates := make(map[string]any)

	if form.NewRole != "" {
		validRoles := map[string]bool{
			string(models.RoleTeacher):           	true,
			string(models.RoleTeacherAssistance):  	true,
			string(models.RoleStudent):            	true,
		}
		if !validRoles[form.NewRole] {
			return nil, errors.New("invalid role: must be 'teacher', 'ta', or 'student'")
		}
		updates["role"] = form.NewRole
	}
	
	if form.NewStatus != "" {
		validStatuses := map[string]bool{
			string(models.StatusActive):   true,
			string(models.StatusInactive): true,
			string(models.StatusWithdraw): true,
			string(models.StatusDrop):     true,
		}
		if !validStatuses[form.NewStatus] {
			return nil, errors.New("invalid status: must be 'active', 'inactive', 'withdraw', or 'drop'")
		}
		updates["status"] = form.NewStatus
	}

	var courseMember models.CourseMember
	err := database.DB.
		Model(&models.CourseMember{}).
		Where("course_id = ? AND user_id = ?", courseID, memberID).
		Updates(updates).Error
	
	if err != nil {
		return nil, err
	}
	
	response := models.ConvertCourseMemberToResponse(&courseMember)

	return &response, nil
}

func CreateAssignment(
	courseID,
	userID string,
	form *models.AssignmentForm,
	files []*multipart.FileHeader,
) (*models.ResponseAssignment, error) {
	var attachments []models.Attachment

	existingCount := len(form.Attachments)
	newFileCount := len(files)

	if existingCount+newFileCount > 5 {
		return nil, errors.New("maximum 5 attachments allowed")
	}

	if existingCount > 0 {
		var existingAttachments []models.Attachment
		if err := database.DB.
			Where("id IN ? AND user_id = ?", form.Attachments, userID).
			Find(&existingAttachments).
			Error; err != nil {
			return nil, err
		}

		if len(existingAttachments) != existingCount {
			return nil, errors.New("one or more invalid attachment ids")
		}

		attachments = append(attachments, existingAttachments...)
	}

	for _, file := range files {
		src, err := file.Open()
		if err != nil {
			return nil, err
		}

		data, err := io.ReadAll(src)
		src.Close()

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

		attachments = append(attachments, newAttachment)
	}

	assignment := models.Assignment{
		CourseID:    courseID,
		Title:       form.Title,
		Description: form.Description,
		Point:       form.Point,
		StartDate:   form.StartDate,
		DueDate:     form.DueDate,
		CloseDate:   form.CloseDate,
	}

	if len(attachments) > 0 {
		assignment.Attachments = attachments
	}
	
	if form.AIAgent != nil {
		assignment.AIAgent = *form.AIAgent
	}
	
	if form.Visible != nil {
		assignment.Visible = *form.Visible
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

	response := models.ConvertAssignmentToResponse(&assignment, false, nil)

	return &response, nil
}

func GetAssignments(userID, courseID, userRole string) (*[]models.ResponseAssignment, error) {
	var assignments []models.Assignment
	query := database.DB.
		Preload("Tags").
		Where("course_id = ?", courseID)

	if models.HasPermission(userRole, "assignment:view_all") {
		//
	} else if models.HasPermission(userRole, "assignment:view_visible") {
		query = query.Where("visible = ?", true)
	} else {
		return nil, errors.New("no permission")
	}

	if err := query.Find(&assignments).Error; err != nil {
		return nil, err
	}
	
	overrideMap := map[string]models.AssignmentOverride{}

	if models.HasPermission(userRole, "submission:view_own") {
		var overrides []models.AssignmentOverride

		if err := database.DB.
			Where("student_id = ?", userID).
			Find(&overrides).Error; err != nil {
			return nil, err
		}

		for _, o := range overrides {
			overrideMap[o.AssignmentID] = o
		}
	}

	response := models.ConvertAssignmentsToResponse(assignments, overrideMap)

	return &response, nil
}

func GetAssignment(userID, courseID, role, assignmentID string) (*models.ResponseDetailedAssignment, error) {
	var assignment models.Assignment
	var submissions []models.Submission
	var override *models.AssignmentOverride
	

	assignmentQuery := database.DB.
		Preload("Tags").
		Preload("Attachments").
		Where("course_id = ?", courseID)
	
	if models.HasPermission(role, "assignment:view_all") {
		//
	} else if models.HasPermission(role, "assignment:view_visible") {
		assignmentQuery = assignmentQuery.Where("visible = ?", true)
	} else {
		return nil, errors.New("no permission")
	}

	if err := assignmentQuery.
		First(&assignment, "id = ?", assignmentID).
		Error; err != nil {
		return nil, err
	}

	submissionQuery := database.DB.
		Where("assignment_id = ?", assignmentID).
		Preload("Attachment").
		Preload("Student")

	if models.HasPermission(role, "submission:view_all") {
		submissionQuery = submissionQuery.Preload("Comments")
		if err := submissionQuery.
			Find(&submissions).
			Error; err != nil {
			return nil, err
		}
	} else if models.HasPermission(role, "submission:view_own") {
		var o models.AssignmentOverride
		err := database.DB.
			Where("assignment_id = ? AND student_id = ?", assignmentID, userID).
			Take(&o).Error

		if err == nil {
			override = &o
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, err
		}

		
		submissionQuery = submissionQuery.Preload("Comments", "visible = ?", true)
		if err := submissionQuery.
			Where("student_id = ?", userID).
			Find(&submissions).
			Error; err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("no permission")
	}

	response := models.ConvertDetailedAssignmentToResponse(&assignment, &submissions, override)

	return &response, nil
}

func UpdateAssignment(
	assignment *models.Assignment,
	form *models.AssignmentForm,
	files []*multipart.FileHeader,
	userID string,
) (*models.ResponseAssignment, error) {

	updates := map[string]any{}

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
	if form.AIAgent != nil {
		updates["ai_agent"] = *form.AIAgent
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&assignment).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	var attachments []models.Attachment

	existingCount := len(form.Attachments)
	newFileCount := len(files)

	if existingCount+newFileCount > 5 {
		return nil, errors.New("maximum 5 attachments allowed")
	}

	if existingCount > 0 {
		var existingAttachments []models.Attachment
		if err := database.DB.
			Where("id IN ? AND user_id = ?", form.Attachments, userID).
			Find(&existingAttachments).
			Error; err != nil {
			return nil, err
		}

		if len(existingAttachments) != existingCount {
			return nil, errors.New("one or more invalid attachment ids")
		}

		attachments = append(attachments, existingAttachments...)
	}

	for _, file := range files {
		src, err := file.Open()
		if err != nil {
			return nil, err
		}

		data, err := io.ReadAll(src)
		src.Close()

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

		attachments = append(attachments, newAttachment)
	}

	if err := database.DB.Model(&assignment).
		Association("Attachments").
		Replace(attachments); err != nil {
		return nil, err
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
		Preload("Attachments").
		First(&assignment, "id = ?", assignment.ID).
		Error; err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentToResponse(assignment, false, nil)
	return &response, nil
}

func CreateAssignmentOverride(assignmentID string, form models.AssignmentOverrideForm) (*models.AssignmentOverride, error) {

	assignmentOverride := models.AssignmentOverride{
		AssignmentID: 		assignmentID,
		StudentID: 			form.StudentID,
		ExtendedDueDate: 	form.ExtendedDueDate,
	}

	if err := database.DB.Create(&assignmentOverride).Error; err != nil {
		return nil, err
	}

	return &assignmentOverride, nil
}

func CreateSubmission(
	assignmentID,
	userID string,
	form *models.SubmissionForm,
	file *multipart.FileHeader,
) (*models.ResponseSubmission, error) {
	var attachment *models.Attachment

	switch {
	// CASE 1: upload new file
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

	default:
		attachment = nil
	}

	submission := models.Submission{
		AssignmentID: assignmentID,
		Answer:       form.Answer,
		StudentID:    userID,
	}

	if attachment != nil {
		submission.AttachmentID = &attachment.ID
	}

	if err := database.DB.Create(&submission).Error; err != nil {
		return nil, err
	}

	response := models.ConvertSubmissionToResponse(&submission)

	return &response, nil
}

func UpdateSubmission(
	submission *models.Submission,
	form *models.SubmissionForm,
	file *multipart.FileHeader,
	userID string,
) (*models.ResponseSubmission, error) {

	updates := map[string]any{}

	if form.Answer != "" {
		updates["answer"] = form.Answer
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&submission).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	var attachment *models.Attachment

	switch {
	// CASE 1: upload new file
	case file != nil:
		// Delete old file from S3 if it exists
		if submission.AttachmentID != nil && submission.Attachment != nil {
			if err := database.DeleteFileFromS3(submission.Attachment.FileKey); err != nil {
				return nil, fmt.Errorf("failed to delete old file from S3: %v", err)
			}
		}
		
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

	// CASE 2: no attachment at all (VALID)
	default:
		// Delete old file from S3 if it exists
		if submission.AttachmentID != nil && submission.Attachment != nil {
			if err := database.DeleteFileFromS3(submission.Attachment.FileKey); err != nil {
				return nil, fmt.Errorf("failed to delete old file from S3: %v", err)
			}
		}
		attachment = nil
	}
	
	var attachmentID *string
	if attachment != nil {
	    attachmentID = &attachment.ID
	} else {
	    attachmentID = nil
	}
	
	if err := database.DB.Model(&submission).
	    Update("attachment_id", attachmentID).Error; err != nil {
	    return nil, err
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
	submissionID,
	userID,
	role string,
	form *models.CommentForm,
) (*models.ResponseComment, error) {
	var existingComment models.Comment
	err := database.DB.
		Where("submission_id = ? AND created_by = ?", submissionID, userID).
		First(&existingComment).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, err
	}

	var comment *models.Comment

	if err == gorm.ErrRecordNotFound {
		comment = &models.Comment{
			SubmissionID:  submissionID,
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

	updates := map[string]any{
		"visible": newVisible,
	}
	
	allowed :=
		models.HasPermission(role, "assignment:comment_any") ||
		(models.HasPermission(role, "assignment:comment_own") &&
			string(comment.CreatedByRole) == role)

	if !allowed {
		return nil, errors.New("no permission")
	}
	
	if err := database.DB.Model(&comment).Updates(updates).Error; err != nil {
		return nil, err
	}
	
	if err := database.DB.First(&comment, "id = ?", comment.ID).Error; err != nil {
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

func GetAssignmentSummary(assignment *models.Assignment) (*models.ResponseAssignmentSummary, error) {
	// Get all active students in the course with their user information
	var courseMembers []models.CourseMember
	if err := database.DB.
		Joins("User"). 
	    Where("course_members.course_id = ?", assignment.CourseID).
	    Where("course_members.role = ?", "student").
	    Where("course_members.status = ?", "active").
	    Find(&courseMembers).Error; err != nil {
	    return nil, err
	}

	totalStudents := int16(len(courseMembers))

	// Get all submissions for this assignment
	var submissions []models.Submission
	if err := database.DB.
		Where("assignment_id = ?", assignment.ID).
		Find(&submissions).Error; err != nil {
		return nil, err
	}

	// Create a map of student ID to submission for easy lookup
	submissionMap := make(map[string]*models.Submission)
	for i := range submissions {
		submissionMap[submissions[i].StudentID] = &submissions[i]
	}

	// Build submission list and calculate statistics
	submissionList := make([]models.ResponseAssignmentSubmissionList, 0, len(courseMembers))
	
	var submitted int16
	var incomplete int16
	var graded int16
	var ungraded int16
	var scores []float32

	for _, cm := range courseMembers {
		var point int16 = 0
		var percentage float32 = 0
		var status string = "no submitted"

		submission, hasSubmission := submissionMap[cm.UserID]

		if hasSubmission && submission.AttachmentID != nil {
			// Has attachment, determine status based on due date
			if submission.UpdatedAt.Before(assignment.DueDate) || submission.UpdatedAt.Equal(assignment.DueDate) {
				status = "submitted"
			} else {
				status = "overduedate"
			}

			// Calculate point and percentage
			if submission.Point != nil {
				point = *submission.Point
				if assignment.Point > 0 {
					percentage = float32(point) / float32(assignment.Point) * 100
				}
				graded++
				scores = append(scores, float32(point))
			} else {
				ungraded++
			}
			submitted++
		} else {
			incomplete++
		}

		submissionList = append(submissionList, models.ResponseAssignmentSubmissionList{
			UserID: 		cm.UserID,
			StudentID:        	cm.User.Username,
			EnName:          	cm.User.EnName,
			ThName:          	cm.User.ThName,
			Email:           	cm.User.Email,
			Point:           	point,
			Percentage:      	percentage,
			SubmissionStatus: 	status,
		})
	}

	notStarted := totalStudents - submitted - incomplete

	var submissionRate float32
	if totalStudents > 0 {
		submissionRate = float32(submitted) / float32(totalStudents) * 100
	}

	var averageScore, highestScore, lowestScore, medianScore float32

	if len(scores) > 0 {
		var sum float32
		for _, s := range scores {
			sum += s
		}
		averageScore = sum / float32(len(scores))

		highestScore = scores[0]
		lowestScore = scores[0]

		for _, s := range scores {
			if s > highestScore {
				highestScore = s
			}
			if s < lowestScore {
				lowestScore = s
			}
		}

		slices.Sort(scores)

		mid := len(scores) / 2
		if len(scores)%2 == 0 {
			medianScore = (scores[mid-1] + scores[mid]) / 2
		} else {
			medianScore = scores[mid]
		}
	}

	distribution := createScoreDistribution(scores, float32(assignment.Point))

	response := models.ResponseAssignmentSummary{
		Statistic: models.ResponseAssignmentStatistic{
			Student:        totalStudents,
			Submitted:      submitted,
			Incomplete:     incomplete,
			NotStarted:     notStarted,
			SubmissionRate: submissionRate,
			Graded:         graded,
			Ungraded:       ungraded,
			AverageScore:   averageScore,
			HighestScore:   highestScore,
			LowestScore:    lowestScore,
			MedianScore:    medianScore,
			Distribution:   distribution,
		},
		SubmissionList: submissionList,
	}

	return &response, nil
}

func createScoreDistribution(scores []float32, maxPoints float32) []models.ScoreDistribution {

	if maxPoints <= 0 {
		maxPoints = 100
	}

	binSize := maxPoints / 5

	distribution := make([]models.ScoreDistribution, 5)

	for i := range distribution {
		start := float32(i) * binSize
		end := start + binSize

		if i == len(distribution)-1 {
			end = maxPoints
		}

		distribution[i] = models.ScoreDistribution{
			RangeStart: start,
			RangeEnd:   end,
			Count:      0,
		}
	}

	for _, score := range scores {
		for i := range distribution {
			if i == len(distribution)-1 {

				if score >= distribution[i].RangeStart && score <= distribution[i].RangeEnd {
					distribution[i].Count++
					break
				}
			} else {
				if score >= distribution[i].RangeStart && score < distribution[i].RangeEnd {
					distribution[i].Count++
					break
				}
			}
		}
	}

	return distribution
}