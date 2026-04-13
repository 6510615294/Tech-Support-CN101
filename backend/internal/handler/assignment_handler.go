package handler

import (
	"mime/multipart"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterAssignmentRoutes(app fiber.Router) {
	app.Post("", createAssignment)
	app.Get("", getAssignments)
	app.Get("/:assignment_id", getAssignment)
	app.Put("/:assignment_id", updateAssignment)
	app.Delete("/:assignment_id", deleteAssignment)
	app.Get("/:assignment_id/summary", getAssignmentSummary)
	app.Post("/:assignment_id/override", createAssignmentOverride)
	app.Get("/:assignment_id/auto-grading", autoGradingAssignment)
	app.Get("/:assignment_id/submissions/download", downloadSubmissions)
}

func createAssignment(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	if !models.HasPermission(role, "assignment:create") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AssignmentForm
	if err := c.Bind().Body(&form); err != nil {
		print(string(c.Body()))
		return SendError(c, errors.ErrBadRequest)
	}

	multipartForm, _ := c.MultipartForm()

	var files []*multipart.FileHeader
	if multipartForm != nil {
		files = multipartForm.File["files"]
	}

	assignment, err := service.CreateAssignment(courseID, userID, &form, files)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(assignment)
}

func getAssignments(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	assignments, err := service.GetAssignments(userID, courseID, role)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(fiber.Map{
		"role":        role,
		"assignments": assignments,
	})
}

func getAssignment(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	data, err := service.GetAssignment(userID, courseID, role, assignmentID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(fiber.Map{
		"role":       	role,
		"assignment": 	data.Assignment,
		"submissions":	data.Submissions,
	})
}

func updateAssignment(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	if !models.HasPermission(role, "assignment:update") {
		return SendError(c, errors.ErrForbidden)
	}

	multipartForm, _ := c.MultipartForm()

	var files []*multipart.FileHeader
	if multipartForm != nil {
		files = multipartForm.File["files"]
	}

	var form models.AssignmentForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	data, err := service.UpdateAssignment(courseID, assignmentID, userID, &form, files)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(data)
}

func deleteAssignment(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	if !models.HasPermission(role, "assignment:delete") {
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteAssignment(courseID, assignmentID)
	if err != nil {
		return SendError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "assignment deleted",
	})
}

func createAssignmentOverride(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	assignmentID := c.Params("assignment_id")
	role := c.Locals("course_role").(string)

	if !models.HasPermission(role, "assignment:update") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AssignmentOverrideForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	override, err := service.CreateAssignmentOverride(courseID, assignmentID, form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(override)
}

func getAssignmentSummary(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	if !models.HasPermission(role, "assignment:view_all") {
		return SendError(c, errors.ErrForbidden)
	}

	summary, err := service.GetAssignmentSummary(courseID, assignmentID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(summary)
}

func autoGradingAssignment(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	assignmentID := c.Params("assignment_id")

	if !models.HasPermission(role, "ai") {
		return SendError(c, errors.ErrForbidden)
	}

	err := service.AutoGradingAssignment(userID, courseID, assignmentID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "auto grading started",
	})
}

func downloadSubmissions(c fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	assignmentID := c.Params("assignment_id")

	if !models.HasPermission(role, "file:download_all") {
		return SendError(c, errors.ErrForbidden)
	}

	zipData, err := service.DownloadSubmissions(courseID, assignmentID)
	if err != nil {
		return SendError(c, err)
	}

	c.Set("Content-Type", "application/zip")
	c.Set("Content-Disposition", "attachment; filename=submissions.zip")

	return c.Send(zipData)
}
