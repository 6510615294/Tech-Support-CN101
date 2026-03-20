package service

import (
	// "time"
	// 
	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

var secret = config.GetEnv("JWT_SECRET")

// GenerateToken creates a JWT for a given user ID.
func GenerateToken(userID string) (string, error) {

	claims := jwt.MapClaims{
		"user_id": userID,
		// "exp":     time.Now().Add(14 * 24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	
	return token.SignedString([]byte(secret))
}
