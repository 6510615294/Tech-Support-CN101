package main

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/router"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
    config.LoadEnv()
    database.Connect()

    app := fiber.New()
    app.Use(cors.New())
    router.SetupRoutes(app)

    app.Listen(":8080")
}
