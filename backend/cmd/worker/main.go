package main

import (
	"log"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/worker"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
)

func main() {
	config.LoadEnv()
	logger.Init()
	database.Connect()

	database.ConnectS3("cnproject-6510615120")

	log.Println("Worker is starting...")

	redisAddr := config.GetEnv("REDIS_ADDRESS")
	redisPassword := config.GetEnv("REDIS_PASSWORD")

	worker.Start(redisAddr, redisPassword)
}
