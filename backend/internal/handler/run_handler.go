package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterRunRoutes(app fiber.Router) {
	app.Post("/run/python3", runPython)
}

func getRole(userID string) models.Role {
	var role models.Role
	database.DB.Model(&models.User{}).
		Select("role").
		Where("id = ?", userID).
		Scan(&role)

	return role
}

func runPython(c *fiber.Ctx) error {
	role := c.Locals("user_role").(string)


	if !models.HasPermission(role, "run:python") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.PythonCodeForm
	if err := c.BodyParser(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	output, err := service.RunPython(form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(output)
}
