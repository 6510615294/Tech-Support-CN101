package middleware

import (
	"runtime/debug"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
	"github.com/gofiber/fiber/v3"
)

func Recover() fiber.Handler {
	return func(c fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				reqID, _ := c.Locals("request_id").(string)
				userID, _ := c.Locals("user_id").(string)

				logger.Log.Error("panic_recovered",
					"panic", r,
					"stack", string(debug.Stack()),
					"path", c.Path(),
					"method", c.Method(),
					"request_id", reqID,
					"user_id", userID,
				)

				_ = c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "internal server error",
				})
			}
		}()

		return c.Next()
	}
}