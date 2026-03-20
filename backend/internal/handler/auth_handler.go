package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterAuthRoutes(app fiber.Router) {
	app.Post("/login", login)
}

func login(c fiber.Ctx) error {
	var form models.LoginForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	user, err := service.AuthenticateUser(&form)
	if err != nil {
		return SendError(c, err)
	}

	token, _ := service.GenerateToken(user.ID)

	response := models.LoginResponse{
		Token: 		token,
		Username: 	user.Username,
		EnName:		user.EnName,
		ThName: 	user.ThName,
		Role: 		string(user.Role),	
	}
	
	return c.JSON(response)
}