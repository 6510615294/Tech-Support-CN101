package auth

import (
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/6510615294/Tech-Support-CN101/backend/internal/config"
)

func GenerateToken(userID string) (string, error) {
    secret := config.GetEnv("JWT_SECRET")

    claims := jwt.MapClaims{
        "user_id": userID,
        "exp":     time.Now().Add(24 * time.Hour).Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}
