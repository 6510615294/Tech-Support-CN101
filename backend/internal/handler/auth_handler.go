package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v2"
)

func RegisterAuthRoutes(app fiber.Router) {
    app.Post("/login", login)
}

func login(c *fiber.Ctx) error {
	var form models.LoginForm
    if err := c.BodyParser(&form); err != nil {
    	return SendError(c, errors.ErrBadRequest)
    }

    user, err := service.AuthenticateUser(&form)
    if err != nil {
		return SendError(c, err)
	}

    token, _ := service.GenerateToken(user.ID)

    return c.JSON(fiber.Map{"token": token})
}
