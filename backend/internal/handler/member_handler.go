package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterMemberRoutes(app fiber.Router) {
	app.Get("/", getMember)
	app.Put("/:member_id", updateMember)
	app.Delete("/:member_id", deleteMember)
}

func getMember(c fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)

	if !models.HasPermission(role, "member:view_all") {
		return SendError(c, errors.ErrForbidden)
	}

	students, err := service.GetMember(courseID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(students)
}

func updateMember(c fiber.Ctx) error {
	log := logger.WithRequest(c)
	
	log.Info("member_update_attempt")
	
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	memberID := c.Params("member_id")
	userID := c.Locals("user_id").(string)

	if userID == memberID {
		log.Error("member_update_failed",
			"error", errors.ErrBadRequest,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	if !models.HasPermission(role, "member:update") {
		log.Error("member_update_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	var form models.UpdateMemberForm
	if err := c.Bind().Body(&form); err != nil {
		log.Error("member_update_failed",
			"error", err,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	member, err := service.UpdateMember(courseID, memberID, &form)
	if err != nil {
		log.Error("member_update_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("member_update_success",
		"course_id", courseID,
		"member_id", memberID,
	)
	
	return c.JSON(member)
}

func deleteMember(c fiber.Ctx) error {
	log := logger.WithRequest(c)
	
	log.Info("member_delete_attempt")
	
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	memberID := c.Params("member_id")
	userID := c.Locals("user_id").(string)

	if userID == memberID {
		log.Error("member_delete_failed",
			"error", errors.ErrBadRequest,
		)
		return SendError(c, errors.ErrBadRequest)
	}

	if !models.HasPermission(role, "member:delete") {
		log.Error("member_delete_failed",
			"error", errors.ErrForbidden,
		)
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteMember(courseID, memberID)
	if err != nil {
		log.Error("member_delete_failed",
			"error", err,
		)
		return SendError(c, err)
	}

	log.Info("member_delete_success",
		"course_id", courseID,
		"member_id", memberID,
	)
	
	return c.JSON(fiber.Map{
		"message": "deleted member",
	})
}
