package main

import (
    "log"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"

    "github.com/6510615294/Tech-Support-CN101/backend/internal/config"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/database"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/router"
)

func main() {
    config.LoadEnv()
    database.Connect()

    database.ConnectS3("cnproject-6510615120")

    app := fiber.New()
    app.Use(cors.New())

    router.SetupRoutes(app)

    log.Println("Server running on :8080")
    app.Listen(":8080")
}
