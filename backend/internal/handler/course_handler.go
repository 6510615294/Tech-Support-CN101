package handler

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
	"github.com/gofiber/fiber/v3"
)

func RegisterCourseWithoutIDRoutes(app fiber.Router) {
	app.Post("/", createCourse)
	app.Get("/", getCourses)
}

func RegisterCourseRoutes(app fiber.Router) {
	app.Get("/", getCourse)
	app.Put("/", updateCourse)
	app.Delete("/", deleteCourse)
	app.Post("/enroll", enrollCourse)
}

func createCourse(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "course:create") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.CourseForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	data, err := service.CreateCourse(userID, role, &form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(data)
}

func getCourses(c fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	courses, err := service.GetCourses(userID, role)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(courses)
}

func getCourse(c fiber.Ctx) error {
	courseID := c.Params("course_id")

	course, err := service.GetCourse(courseID)
	if err != nil {
		SendError(c, err)
	}

	return c.JSON(course)
}

func updateCourse(c fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	if !models.HasPermission(role, "course:update") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.CourseForm
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	data, err := service.UpdateCourse(courseID, &form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(data)
}

func deleteCourse(c fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	if !models.HasPermission(role, "course:delete") {
		return SendError(c, fiber.ErrForbidden)
	}

	err := service.DeleteCourse(courseID)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(fiber.Map{
		"message": "course deleted",
	})
}

func enrollCourse(c fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	if !models.HasPermission(role, "course:enroll") {
		return SendError(c, errors.ErrForbidden)
	}

	var form models.EnrollmentForms
	if err := c.Bind().Body(&form); err != nil {
		return SendError(c, errors.ErrBadRequest)
	}

	data, err := service.EnrollCourse(courseID, &form)
	if err != nil {
		return SendError(c, err)
	}

	return c.JSON(data)
}
