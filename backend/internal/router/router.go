package router

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/api/auth"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/api/me"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
    api := app.Group("/api")
    authGroup := api.Group("/auth")
    auth.RegisterRoutes(authGroup)

    protected := api.Group("")
    protected.Use(middleware.AuthMiddleware)
    me.RegisterRoutes(protected) 
}