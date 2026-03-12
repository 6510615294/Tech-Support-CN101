package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
    "github.com/gofiber/fiber/v2"
)

func RegisterMeRoutes(app fiber.Router) {
    app.Get("/me", me)
}

func me(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	data, err := service.GetUserData(userID)
    if err != nil {
    	return SendError(c, err) 
    }

    return c.JSON(data)
}
