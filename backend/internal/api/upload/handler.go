package upload

import (
	"context"
	"net/http"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
    app.Post("/upload", uploadFile)
}

func uploadFile(c *fiber.Ctx) error {
	service := NewUploadService(database.S3Client, database.BucketName)
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "file is required"})
	}

	attachment, err := service.UploadFile(idStr, context.TODO(), fileHeader)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(attachment)
}
