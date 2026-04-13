package service

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/queue"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
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
		CourseID:    		courseID,
		Title:       		form.Title,
		Description: 		form.Description,
		Point:       		form.Point,
		StartDate:   		form.StartDate,
		DueDate:     		form.DueDate,
		CloseDate:   		form.CloseDate,
		Attachments: 		attachments,
		Tags:        		tags,
		AIAgent:     		form.AIAgent,
		AssignmentPrompt: 	form.AssignmentPrompt,
		Visible:     		form.Visible,
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
	if form.AssignmentPrompt != "" {
		updates["assignment_prompt"] = form.AssignmentPrompt
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

func AutoGradingAssignment(userID, courseID, assignmentID string) error {
	_, err := repository.GetAssignment(courseID, assignmentID)
	if err != nil {
		return err
	}

	job, _ := repository.GetGradingJob(assignmentID, userID)
	if job != nil {
		if job.Status == models.JobPending || job.Status == models.JobProcessing {
			return errors.ErrAIGradingLimit
		}

		err = repository.ResetGradingJob(job.ID)
		if err != nil {
			return err
		}
	} else {
		err := repository.CreateGradingJob(assignmentID, userID)
		if err != nil {
			return err
		}
	}

	payload := queue.AutoGradingPayload{
		AssignmentID: assignmentID,
		TeacherID:    userID,
	}

	err = queue.EnqueueAutoGrading(payload)
	if err != nil {
		return err
	}

	return nil
}

func AutoGradingAssignmentN8N(userID, courseID, assignmentID string) error {
	n8nURL := config.GetEnv("N8N_URL")

	// Get assignment
	assignment, err := repository.GetAssignment(courseID, assignmentID)
	if err != nil {
		return err
	}

	// Get AI config for user
	aiConfig, err := repository.GetAIConfig(userID)
	if err != nil {
		return err
	}

	// Get submissions with attachments
	submissions, err := repository.GetSubmissionsWithAttachments(assignmentID)
	if err != nil {
		return err
	}

	// Build N8NSubmissions array
	n8nSubmissions := []models.AISubmissionForm{}
	for i, submission := range submissions {
		print(i)
		answer := submission.Answer

		// If submission has an attachment, download and read the text from S3
		if submission.Attachment != nil {
			fileBytes, err := database.DownloadFileFromS3ByKey(submission.Attachment.FileKey)
			if err != nil {
				return err
			}
			answer = string(fileBytes)
		}

		n8nSubmission := models.AISubmissionForm{
			SubmissionID: submission.ID,
			Answer:       answer,
		}
		n8nSubmissions = append(n8nSubmissions, n8nSubmission)
	}

	// Build N8NForm
	n8nForm := models.AIForm{
		AIConfig: models.ResponseAIConfig{
			Provider:       aiConfig.Provider,
			Model:          aiConfig.Model,
			BaseURL:        aiConfig.BaseURL,
			Temperature:    aiConfig.Temperature,
			PromptTemplate: aiConfig.PromptTemplate,
		},
		MaxPoint:         assignment.Point,
		AssignmentPrompt: assignment.AssignmentPrompt,
		Submissions:      n8nSubmissions,
	}

	// Serialize to JSON
	formBytes, err := json.Marshal(n8nForm)
	if err != nil {
		return err
	}

	// Send POST request to n8n URL
	req, err := http.NewRequest("POST", n8nURL, bytes.NewBuffer(formBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("n8n returned status %d", resp.StatusCode)
	}

	return nil
}

func DownloadSubmissions(courseID, assignmentID string) ([]byte, error) {
	if _, err := repository.GetAssignment(courseID, assignmentID); err != nil {
		return nil, err
	}

	submissions, err := repository.GetSubmissionsWithAttachments(assignmentID)
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
