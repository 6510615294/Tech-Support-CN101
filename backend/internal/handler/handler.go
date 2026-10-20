package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/gofiber/fiber/v3"
)

func SendError(c fiber.Ctx, err error) error {
	// Default to 500 if it's not our custom AppError
	code := fiber.StatusInternalServerError
	message := "An unexpected error occurred"

	if appErr, ok := err.(*errors.AppError); ok {
		code = appErr.Code
		message = appErr.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error": message,
	})
}
