package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterMemberRoutes(app fiber.Router) {
	app.Get("/", getMember)
	app.Put("/:member_id", updateMember)
	app.Delete("/:member_id", deleteMember)
}

func getMember(c *fiber.Ctx) error {
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

func updateMember(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	memberID := c.Params("member_id")

	if !models.HasPermission(role, "member:update") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.UpdateMemberForm
	if err := c.BodyParser(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	member, err := service.UpdateMember(courseID, memberID, &form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(member)
}

func deleteMember(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	memberID := c.Params("member_id")

	if !models.HasPermission(role, "member:delete") {
		return SendError(c, errors.ErrForbidden)
	}

	err := service.DeleteMember(courseID, memberID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "deleted member",
	})
}