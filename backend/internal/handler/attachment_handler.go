package handler

import (
	"fmt"
	"mime/multipart"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterAttachmentRoutes(app fiber.Router) {
	app.Post("", createAttachments)
	app.Get("", getAttachments)
	app.Get("/:attachment_id/download", downloadAttachment)
	app.Delete("/:attachment_id", deleteAttachment)
}

func createAttachments(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "template:create") {
		return SendError(c, errors.ErrForbidden)
	}

	multipartForm, _ := c.MultipartForm()

	var files []*multipart.FileHeader
	if multipartForm != nil {
		files = multipartForm.File["files"]
	}

	err := service.CreateAttachments(userID, files)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "attachments created",
	})
}

func getAttachments(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "template:view") {
		return SendError(c, errors.ErrForbidden)
	}

	attachments, err := service.GetAttachments(userID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(attachments)
}

func downloadAttachment(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	attachmentID := c.Params("attachment_id")

	if !models.HasPermission(role, "template:view") {
		return SendError(c, errors.ErrForbidden)
	}

	attachment, filename, contentType, err := service.DownloadAttachment(userID, attachmentID)
	if err != nil {
		return SendError(c, err)
	}

	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return c.Send(attachment)
}

func deleteAttachment(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	attachmentID := c.Params("attachment_id")

	if !models.HasPermission(role, "template:delete") {
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteAttachment(userID, attachmentID)
	if err != nil {
		return SendError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "attachment deleted",
	})
}
