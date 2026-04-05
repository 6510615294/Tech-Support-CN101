package handler

import (
	"mime/multipart"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterTemplateRoutes(app fiber.Router) {
	app.Post("", createAssignmentTemplate)
	app.Get("", getAssignmentTemplates)
	app.Get("/short", getShortAssignmentTemplates)
	app.Get("/:template_id", getAssignmentTemplate)
	app.Put("/:template_id", updateAssignmentTemplate)
	app.Delete("/:template_id", deleteAssignmentTemplate)
}

func createAssignmentTemplate(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "template:create") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AssignmentTemplateForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	multipartForm, _ := c.MultipartForm()

	var files []*multipart.FileHeader
	if multipartForm != nil {
		files = multipartForm.File["files"]
	}

	template, err := service.CreateAssignmentTemplate(userID, &form, files)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(template)
}

func getAssignmentTemplates(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "template:view") {
		return SendError(c, errors.ErrForbidden)
	}

	templates, err := service.GetAssignmentTemplates(userID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(templates)
}

func getShortAssignmentTemplates(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "template:view") {
		return SendError(c, errors.ErrForbidden)
	}

	templates, err := service.GetShortAssignmentTemplates(userID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(templates)
}

func getAssignmentTemplate(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	templateID := c.Params("template_id")

	if !models.HasPermission(role, "template:view") {
		return SendError(c, errors.ErrForbidden)
	}

	template, err := service.GetAssignmentTemplate(userID, templateID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(template)
}

func updateAssignmentTemplate(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	templateID := c.Params("template_id")

	if !models.HasPermission(role, "template:update") {
		return SendError(c, errors.ErrForbidden)
	}

	multipartForm, _ := c.MultipartForm()

	var files []*multipart.FileHeader
	if multipartForm != nil {
		files = multipartForm.File["files"]
	}

	var form models.AssignmentTemplateForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	template, err := service.UpdateAssignmentTemplate(templateID, userID, &form, files)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(template)
}

func deleteAssignmentTemplate(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	templateID := c.Params("template_id")

	if !models.HasPermission(role, "template:delete") {
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteAssignmentTemplate(userID, templateID)
	if err != nil {
		return SendError(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "template deleted",
	})
}
