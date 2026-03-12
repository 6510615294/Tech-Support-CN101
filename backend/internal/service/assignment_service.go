package service

import (
	"fmt"
	"mime/multipart"
	"strings"
	"archive/zip"
	"bytes"
	"io"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func CreateAssignment(
	courseID,
	userID string,
	form *models.AssignmentForm,
	files []*multipart.FileHeader,
) (*models.ResponseAssignment, error) {
	if len(form.Attachments)+len(files) > 5 {
		return nil, errors.ErrTooManyAttachments
	}

	attachments, err := handleAttachments(userID, form.Attachments, files)
	if err != nil {
		return nil, err
	}

	tags, err := resolveTags(form.Tags)
	if err != nil {
		return nil, err
	}

	assignment := models.Assignment{
		CourseID:    courseID,
		Title:       form.Title,
		Description: form.Description,
		Point:       form.Point,
		StartDate:   form.StartDate,
		DueDate:     form.DueDate,
		CloseDate:   form.CloseDate,
		Attachments: attachments,
		Tags:        tags,
		AIAgent: 	 form.AIAgent,
		Visible: 	 form.Visible,
	}

	if err := repository.CreateAssignment(&assignment); err != nil {
		return nil, err
	}

	resp := models.ConvertAssignmentToResponse(&assignment, false, nil)
	return &resp, nil
}

func GetAssignments(userID, courseID, role string) (*[]models.ResponseAssignment, error) {
	var assignments []models.Assignment
	var err error
	
	if models.HasPermission(role, "assignment:view_all") {
		assignments, err = repository.GetAssignmentsByCourse(courseID)

	} else if models.HasPermission(role, "assignment:view_visible") {
		assignments, err = repository.GetVisibleAssignments(courseID)
	
	} else {
		return nil, errors.ErrForbidden
	}

	if err != nil {
		return nil, err
	}
	
	overrideMap := map[string]models.AssignmentOverride{}

	if models.HasPermission(role, "submission:view_own") {
		overrides, err := repository.GetOverridesByStudent(userID)
		if err != nil {
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
	var assignment *models.Assignment
	var submissions []models.Submission
	var override *models.AssignmentOverride
	var err error
	
	if models.HasPermission(role, "assignment:view_all") {
		assignment, err = repository.GetAssignmentWithRelations(courseID, assignmentID)
	
	} else if models.HasPermission(role, "assignment:view_visible") {
		assignment, err = repository.GetVisibleAssignment(courseID, assignmentID)
	
	} else {
		return nil, errors.ErrForbidden
	}

	if err != nil {
		return nil, err
	}

	if models.HasPermission(role, "submission:view_all") {
		submissions, err = repository.GetSubmissionsWithComments(assignmentID)
	
	} else if models.HasPermission(role, "submission:view_own") {
		submissions, err = repository.GetStudentSubmissions(assignmentID, userID)
		if err != nil {
			return nil, err
		}

		override, err = repository.GetAssignmentOverride(assignmentID, userID)
		if err != nil {
			return nil, err
		}

	} else {
		return nil, errors.ErrForbidden
	}

	response := models.ConvertDetailedAssignmentToResponse(assignment, &submissions, override)

	return &response, nil
}

func UpdateAssignment(
	courseID string,
	assignmentID string,
	userID string,
	form *models.AssignmentForm,
	files []*multipart.FileHeader,
) (*models.ResponseAssignment, error) {

	assignment, err := repository.GetAssignmentWithRelations(courseID, assignmentID)
	if err != nil {
		return nil, err
	}
	
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
	updates["visible"] = form.Visible
	updates["ai_agent"] = form.AIAgent


	if len(updates) > 0 {
		if err := repository.UpdateAssignment(assignmentID, updates); err != nil {
			return nil, err
		}
	}
	attachments, err := handleAttachments(
		userID,
		form.Attachments,
		files,
	)
	if err != nil {
		return nil, err
	}

	if err := repository.ReplaceAssignmentAttachments(
		assignmentID,
		attachments,
	); err != nil {
		return nil, err
	}

	tags, err := resolveTags(form.Tags)
	if err != nil {
		return nil, err
	}

	if err := repository.ReplaceAssignmentTags(assignmentID, tags); err != nil {
		return nil, err
	}

	assignment, err = repository.GetAssignmentWithRelations(courseID, assignmentID)
	if err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentToResponse(assignment, false, nil)
	return &response, nil
}

func DeleteAssignment(courseID, assignmentID string) error {

	assignment, err := repository.GetAssignment(courseID, assignmentID)
	if err != nil {
		return err
	}

	if err := repository.DeleteAssignment(assignment); err != nil {
		return err
	}

	return nil
}

func CreateAssignmentOverride(
	courseID string,
	assignmentID string,
	form models.AssignmentOverrideForm,
) (*models.AssignmentOverride, error) {

	assignment, err := repository.GetAssignment(courseID, assignmentID)
	if err != nil {
		return nil, err
	}

	if assignment.ID == "" {
		return nil, errors.ErrAssignmentNotFound
	}

	override := models.AssignmentOverride{
		AssignmentID:    assignmentID,
		StudentID:       form.StudentID,
		ExtendedDueDate: form.ExtendedDueDate,
	}

	return repository.CreateAssignmentOverride(&override)
}

func GetAssignmentSummary(courseID, assignmentID string) (*models.ResponseAssignmentSummary, error) {

	assignment, err := repository.GetAssignment(courseID, assignmentID)
	if err != nil {
		return nil, err
	}

	courseMembers, err := repository.GetActiveStudents(courseID)
	if err != nil {
		return nil, err
	}

	submissions, err := repository.GetAssignmentSubmissions(assignmentID)
	if err != nil {
		return nil, err
	}

	return buildAssignmentSummary(assignment, courseMembers, submissions)
}

func buildAssignmentSummary(
	assignment *models.Assignment,
	courseMembers []models.CourseMember,
	submissions []models.Submission,
) (*models.ResponseAssignmentSummary, error) {

	totalStudents := int16(len(courseMembers))

	submissionMap := make(map[string]*models.Submission)
	for i := range submissions {
		submissionMap[submissions[i].StudentID] = &submissions[i]
	}

	var submitted int16
	var incomplete int16
	var graded int16
	var ungraded int16
	var scores []float32

	submissionList := make([]models.ResponseAssignmentSubmissionList, 0, len(courseMembers))

	for _, cm := range courseMembers {

		var point int16
		var percentage float32
		status := "no submitted"

		submission, ok := submissionMap[cm.UserID]

		if ok && submission.AttachmentID != nil {

			if submission.UpdatedAt.Before(assignment.DueDate) || submission.UpdatedAt.Equal(assignment.DueDate) {
				status = "submitted"
			} else {
				status = "overduedate"
			}

			if submission.Point != nil {
				point = *submission.Point
				percentage = float32(point) / float32(assignment.Point) * 100
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
			UserID:           cm.UserID,
			StudentID:        cm.User.Username,
			EnName:           cm.User.EnName,
			ThName:           cm.User.ThName,
			Email:            cm.User.Email,
			Point:            point,
			Percentage:       percentage,
			SubmissionStatus: status,
		})
	}

	// statistics calculations remain same
	// average, median, distribution etc.

	distribution := createScoreDistribution(scores, float32(assignment.Point))

	response := models.ResponseAssignmentSummary{
		Statistic: models.ResponseAssignmentStatistic{
			Student:      totalStudents,
			Submitted:    submitted,
			Incomplete:   incomplete,
			Distribution: distribution,
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

func DownloadSubmissions(courseID, assignmentID string) ([]byte, error) {
	if _, err := repository.GetAssignment(courseID, assignmentID); err != nil {
		return nil, err
	}	
	
	submissions, err := repository.GetSubmissionsWithAttachments(courseID)
	if err != nil {
		return nil, err
	}

	zipBuffer := new(bytes.Buffer)
	zipWriter := zip.NewWriter(zipBuffer)

	fileCount := 0

	for _, submission := range submissions {

		if submission.Attachment == nil {
			continue
		}

		fileBytes, err := database.DownloadFileFromS3ByKey(submission.Attachment.FileKey)
		if err != nil {
			continue
		}

		safeFileName := sanitizeFileName(submission.Attachment.FileName)
		zipFileName := fmt.Sprintf("%s_%s", submission.Student.Username, safeFileName)

		zipFile, err := zipWriter.Create(zipFileName)
		if err != nil {
			continue
		}

		_, err = zipFile.Write(fileBytes)
		if err != nil {
			continue
		}

		fileCount++
	}

	if err := zipWriter.Close(); err != nil {
		return nil, err
	}

	if fileCount == 0 {
		return nil, errors.ErrAttachmentNotFound
	}

	return zipBuffer.Bytes(), nil
}

func sanitizeFileName(fileName string) string {
	// Replace path separators and other unsafe characters
	unsafeChars := []string{"\\", "/", ":", "*", "?", "\"", "<", ">", "|"}
	sanitized := fileName
	for _, char := range unsafeChars {
		sanitized = strings.ReplaceAll(sanitized, char, "_")
	}
	return sanitized
}

func resolveTags(names []string) ([]models.Tag, error) {

	if len(names) > 5 {
		names = names[:5]
	}

	var clean []string
	for _, t := range names {
		name := strings.TrimSpace(t)
		if name != "" {
			clean = append(clean, name)
		}
	}

	existing, err := repository.FindTags(clean)
	if err != nil {
		return nil, err
	}

	tagMap := map[string]models.Tag{}
	for _, t := range existing {
		tagMap[t.Name] = t
	}

	var result []models.Tag

	for _, name := range clean {

		if tag, ok := tagMap[name]; ok {
			result = append(result, tag)
			continue
		}

		newTag := models.Tag{Name: name}

		if err := repository.CreateTag(&newTag); err != nil {
			return nil, err
		}

		result = append(result, newTag)
	}

	return result, nil
}

func handleAttachments(
	userID string,
	existingIDs []string,
	files []*multipart.FileHeader,
) ([]models.Attachment, error) {

	var attachments []models.Attachment

	existing, err := repository.GetAttachmentsByIDs(userID, existingIDs)
	if err != nil {
		return nil, err
	}
	
	if len(existing) != len(existingIDs) {
		return nil, errors.ErrAttachmentNotFound
	}

	attachments = append(attachments, existing...)

	for _, file := range files {

		src, err := file.Open()
		if err != nil {
			return nil, err
		}

		data, _ := io.ReadAll(src)
		src.Close()

		fileKey, err := database.UploadFileToS3(data, file.Filename)
		if err != nil {
			return nil, err
		}

		att := models.Attachment{
			FileName: file.Filename,
			FileKey:  fileKey,
			UserID:   userID,
		}

		if err := repository.CreateAttachment(&att); err != nil {
			return nil, err
		}

		attachments = append(attachments, att)
	}

	return attachments, nil
}