package main

import (
	"log"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/worker"
)

func main() {
	config.LoadEnv()
	database.Connect()

	database.ConnectS3("cnproject-6510615120")

	log.Println("Worker is starting...")

	worker.Start(
		"",
		"",
	)
}
