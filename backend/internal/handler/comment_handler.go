package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterCommentRoutes(app fiber.Router) {
	app.Post("", createOrUpdateComment)
	app.Post("/:comment_id", toggleComment)
}

func createOrUpdateComment(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	submissionID := c.Params("submission_id")

	if !models.HasPermission(role, "assignment:comment") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.CommentForm
	if err := c.BodyParser(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	data, err := service.CreateOrUpdateComment(courseID, submissionID, userID, role, &form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(data)
}

func toggleComment(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	submissionID := c.Params("submission_id")
	commentID := c.Params("comment_id")
	role := c.Locals("course_role").(string)

	if !models.HasPermission(role, "assignment:comment") {
		return SendError(c, errors.ErrForbidden)
	}

	data, err := service.ToggleComment(courseID, submissionID, commentID, role)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(data)
}