package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterRunRoutes(app fiber.Router) {
	app.Post("/run/python3", runPython)
}

func runPython(c fiber.Ctx) error {
	log := logger.WithRequest(c)
	
	log.Info("python_run_attempt")
	
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "run:python") {
		log.Error("python_run_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.PythonCodeForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("python_run_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	output, err := service.RunPython(form)
	if err != nil {
		log.Error("python_run_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("python_run_success")
	
	return c.JSON(output)
}
