package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterAIRoutes(app fiber.Router) {
	app.Post("", createAICredential)
	app.Get("", getAICredential)
	app.Patch("/:ai_credential_id", updateAICredential)
	app.Delete("/:ai_credential_id", deleteAICredential)
	app.Post("/configs/:ai_credential_id", createAIConfig)
	app.Get("/configs/:ai_credential_id", getAIConfigs)
	app.Get("/configs/detail/:ai_config_id", getAIConfig)
	app.Patch("/configs/:ai_config_id", updateAIConfig)
	app.Delete("/configs/:ai_config_id", deleteAIConfig)
	app.Get("/:ai_credential_id/models", getAIModels)
	app.Get("jobs", getGradingJobs)
	app.Delete("jobs/:id", deleteGradingJob)
	app.Get("/prompts", getPrompts)
	app.Post("/prompts", createPrompt)
	app.Delete("/prompts/:prompt_id", deletePrompt)
}

func createAICredential(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_credential_create_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("ai_credential_create_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AICredentialForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("ai_credential_create_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	credential, err := service.CreateAICredential(userID, &form)
	if err != nil {
		log.Error("ai_credential_create_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_credential_create_success")

	return c.JSON(credential)
}

func getAICredential(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_credential_list_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("ai_credential_list_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	credentials, err := service.GetAICredentialsByUser(userID)
	if err != nil {
		log.Error("ai_credential_list_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_credential_list_success")

	return c.JSON(credentials)
}

func updateAICredential(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_credential_update_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiCredentialID := c.Params("ai_credential_id")

	if !models.HasPermission(role, "ai") {
		log.Error("ai_credential_update_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.AICredentialForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("ai_credential_update_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	credential, err := service.UpdateAICredentialByID(userID, aiCredentialID, &form)
	if err != nil {
		log.Error("ai_credential_update_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_credential_update_success")

	return c.JSON(credential)
}

func deleteAICredential(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_credential_delete_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiCredentialID := c.Params("ai_credential_id")

	if !models.HasPermission(role, "ai") {
		log.Error("ai_credential_delete_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteAICredentialByID(userID, aiCredentialID)
	if err != nil {
		log.Error("ai_credential_delete_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_credential_delete_success")

	return c.JSON(fiber.Map{
		"message": "credential deleted",
	})
}

func createAIConfig(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_config_create_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiCredentialID := c.Params("ai_credential_id")

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

	config, err := service.CreateAIConfig(userID, aiCredentialID, &form)
	if err != nil {
		log.Error("ai_config_create_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_config_create_success")

	return c.JSON(config)
}

func getAIConfigs(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiCredentialID := c.Params("ai_credential_id")

	if !models.HasPermission(role, "ai") {
		return SendError(c, errors.ErrForbidden)
	}

	config, err := service.GetAIConfigs(userID, aiCredentialID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(config)
}

func getAIConfig(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_config_detail_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiConfigID := c.Params("ai_config_id")

	if !models.HasPermission(role, "ai") {
		log.Error("ai_config_detail_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	config, err := service.GetAIConfigByID(userID, aiConfigID)
	if err != nil {
		log.Error("ai_config_detail_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_config_detail_success")

	return c.JSON(config)
}

func updateAIConfig(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_config_update_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiConfigID := c.Params("ai_config_id")

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

	data, err := service.UpdateAIConfig(userID, aiConfigID, &form)
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
	aiConfigID := c.Params("ai_config_id")

	if !models.HasPermission(role, "ai") {
		log.Error("ai_config_delete_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteAIConfig(userID, aiConfigID)
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

func getAIModels(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("ai_models_list_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	aiCredentialID := c.Params("ai_credential_id")

	if !models.HasPermission(role, "ai") {
		log.Error("ai_models_list_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	modelList, err := service.GetModels(userID, aiCredentialID)
	if err != nil {
		log.Error("ai_models_list_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("ai_models_list_success")

	return c.JSON(modelList)
}

func getGradingJobs(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("grading_jobs_list_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("grading_jobs_list_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	jobs, err := service.GetGradingJobs(userID)
	if err != nil {
		log.Error("grading_jobs_list_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("grading_jobs_list_success")

	return c.JSON(jobs)
}

func deleteGradingJob(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("grading_job_delete_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	gradingJobID := c.Params("id")

	if !models.HasPermission(role, "ai") {
		log.Error("grading_job_delete_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteGradingJob(gradingJobID, userID)
	if err != nil {
		log.Error("grading_job_delete_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("grading_job_delete_success",
		"grading_job_id", gradingJobID,
	)

	return c.JSON(fiber.Map{
		"message": "grading job deleted",
	})
}

func getPrompts(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("prompt_list_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("prompt_list_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	prompts, err := service.GetPromptTemplates(userID)
	if err != nil {
		log.Error("prompt_list_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("prompt_list_success")

	return c.JSON(prompts)
}

func createPrompt(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("prompt_create_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "ai") {
		log.Error("prompt_create_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.PromptTemplateForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("prompt_create_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	prompt, err := service.CreatePromptTemplate(userID, &form)
	if err != nil {
		log.Error("prompt_create_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("prompt_create_success")

	return c.JSON(prompt)
}

func deletePrompt(c fiber.Ctx) error {
	log := logger.WithRequest(c)

	log.Info("prompt_delete_attempt")

	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	promptID := c.Params("prompt_id")

	if !models.HasPermission(role, "ai") {
		log.Error("prompt_delete_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeletePromptTemplate(userID, promptID)
	if err != nil {
		log.Error("prompt_delete_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("prompt_delete_success")

	return c.JSON(fiber.Map{
		"message": "prompt deleted",
	})
}
