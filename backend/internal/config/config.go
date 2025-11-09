package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using system environment")
    }
}

func GetEnv(key string) string {
    return os.Getenv(key)
}
