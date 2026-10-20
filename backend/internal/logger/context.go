package logger

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"
)

func WithRequest(c fiber.Ctx) *slog.Logger {
	reqID, _ := c.Locals("request_id").(string)
	userID, _ := c.Locals("user_id").(string)

	log := Log.With(
		"request_id", reqID,
	)

	if userID != "" {
		log = log.With("user_id", userID)
	}

	return log
}