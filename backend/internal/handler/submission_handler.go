package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterSubmissionRoutes(app fiber.Router) {
	app.Post("", createSubmission)
	app.Put("/:submission_id", updateSubmission)
	app.Put("/:submission_id/grade", updateGrade)
	app.Get("/:submission_id/read", readSubmission)
}

func createSubmission(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	assignmentID := c.Params("assignment_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)

	if !models.HasPermission(role, "submission:create") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.SubmissionForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	file, _ := c.FormFile("file")

	submission, err := service.CreateSubmission(courseID, assignmentID, userID, &form, file)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(submission)
}

func updateSubmission(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	submissionID := c.Params("submission_id")

	if !models.HasPermission(role, "submission:update") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.SubmissionForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	file, _ := c.FormFile("file")

	result, err := service.UpdateSubmission(submissionID, userID, &form, file)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(result)
}

func updateGrade(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	submissionID := c.Params("submission_id")
	role := c.Locals("course_role").(string)

	if !models.HasPermission(role, "assignment:grade") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.GradeForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	result, err := service.UpdateGrade(courseID, submissionID, role, &form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(result)
}

func readSubmission(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	submissionID := c.Params("submission_id")
	print("test1")
	content, err := service.ReadSubmission(submissionID, userID, role)
	print("test2")
	if err != nil {
		return err
	}

	return c.JSON(content)
}
