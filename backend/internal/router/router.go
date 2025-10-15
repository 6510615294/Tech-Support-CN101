package router

import (
    "github.com/gofiber/fiber/v2"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/api/auth"
)

func SetupRoutes(app *fiber.App) {
    api := app.Group("/api")
    authGroup := api.Group("/auth")

    auth.RegisterRoutes(authGroup)
}
