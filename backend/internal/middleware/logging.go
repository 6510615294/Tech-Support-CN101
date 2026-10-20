package middleware

import (
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
	"github.com/gofiber/fiber/v3"
)

func Logging() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)

		reqID, _ := c.Locals(RequestIDKey).(string)

		logger.Log.Info("http_request",
			"method", c.Method(),
			"path", c.Path(),
			"status", c.Response().StatusCode(),
			"duration_ms", duration.Milliseconds(),
			"ip", c.IP(),
			"request_id", reqID,
		)

		return err
	}
}