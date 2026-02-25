package run

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
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
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)

	if getRole(idStr) != "teacher" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var form models.PythonCodeForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}
	
	data, err := RunPython(form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}