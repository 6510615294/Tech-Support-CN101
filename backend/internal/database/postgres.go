package database

import (
	"log"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Connect initializes the PostgreSQL connection and runs migrations.
func Connect() {
	dsn := config.GetEnv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL not set in environment")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations for all models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Course{},
		&models.Enrollment{},
	); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Connected to PostgreSQL ✅")
	DB = db
}
