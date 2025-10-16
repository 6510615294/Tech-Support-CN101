package middleware

import (
	"errors"
	"strings"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var secret = config.GetEnv("JWT_SECRET")

func AuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")

	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Missing Authorization header",
		})
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	claims, err := ParseToken(tokenStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid or expired token",
		})
	}

	c.Locals("user_id", claims["user_id"])
	return c.Next()
}

// ParseToken validates and parses a JWT token string.
func ParseToken(tokenStr string) (jwt.MapClaims, error) {

    token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
        // Make sure token uses HMAC and correct signing method
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return []byte(secret), nil
    })

    if err != nil {
        return nil, err
    }

    // Extract claims if valid
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        return claims, nil
    }

    return nil, errors.New("invalid token")
}
