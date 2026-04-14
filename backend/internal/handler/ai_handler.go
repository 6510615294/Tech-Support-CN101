package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterAIRoutes(app fiber.Router) {
	app.Post("", createAIConfig)
	app.Get("", getAIConfig)
	// app.Get("/models", getAIModels)
	app.Put("", updateAIConfig)
	app.Delete("", deleteAIConfig)
	// app.Post("/grading", aiGrading)
}

func createAIConfig(c fiber.Ctx) error {
	log := logger.WithRequest(c)
	
	log.Info("ai_config_create_attempt")
	
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("ai_config_create_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AIConfigForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("ai_config_create_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	config, err := service.CreateAIConfig(userID, &form)
	if err != nil {
		log.Error("ai_config_create_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_config_create_success")
	
	return c.JSON(config)
}

func getAIConfig(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		return SendError(c, errors.ErrForbidden)
	}

	config, err := service.GetAIConfig(userID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(config)
}

func updateAIConfig(c fiber.Ctx) error {
	log := logger.WithRequest(c)
	
	log.Info("ai_config_update_attempt")
	
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("ai_config_update_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AIConfigForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("ai_config_update_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	data, err := service.UpdateAIConfig(userID, &form)
	if err != nil {
		log.Error("ai_config_update_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_config_update_success")
	
	return c.JSON(data)
}

func deleteAIConfig(c fiber.Ctx) error {
	log := logger.WithRequest(c)
	
	log.Info("ai_config_delete_attempt")
	
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("ai_config_delete_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteAIConfig(userID)
	if err != nil {
		log.Error("ai_config_delete_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_config_delete_success")
	
	return c.JSON(fiber.Map{
		"message": "crendential deleted",
	})
}

// func aiGrading(c fiber.Ctx) error {
// 	userID := c.Locals("user_id").(string)
// 	role := c.Locals("user_role").(string)

// 	if !models.HasPermission(role, "assignment:grade") {
// 		return SendError(c, errors.ErrForbidden)
// 	}

// 	var form []models.AIGradingForm
// 	if err := c.Bind().Body(&form); err != nil {
// 		return SendError(c, errors.ErrBadRequest)
// 	}

// 	err := service.AIGrading(userID, &form)
// 	if err != nil {
// 		return SendError(c, err)
// 	}

// 	return c.JSON(fiber.Map{
// 		"message": "ai graded",
// 	})
// }
