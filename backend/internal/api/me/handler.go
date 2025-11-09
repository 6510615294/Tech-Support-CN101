package me

import (
    "github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
    app.Get("/me", me)
}

func me(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	
	idStr, ok := userID.(string)
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "invalid user id in token",
        })
    }

	data, err := GetUserData(idStr)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(data)
}
