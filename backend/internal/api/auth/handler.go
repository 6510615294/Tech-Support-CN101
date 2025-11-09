package auth

import (
    "github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
    app.Post("/login", login)
}

func login(c *fiber.Ctx) error {
    var data struct {
        Username    string `json:"username"`
        Password    string `json:"password"`
    }

    if err := c.BodyParser(&data); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    user, err := AuthenticateUser(data.Username, data.Password)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
    }

    token, _ := GenerateToken(user.ID)

    return c.JSON(fiber.Map{"token": token})
}
