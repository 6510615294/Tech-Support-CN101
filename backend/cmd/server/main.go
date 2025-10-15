package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/config"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/database"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/router"
)

func main() {
    config.LoadEnv()
    database.Connect()

    app := fiber.New()
    router.SetupRoutes(app)

    app.Listen(":8080")
}
