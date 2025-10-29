package course

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
    app.Get("/courses", getCourse)
    app.Post("/courses", createCourse)
    app.Put("/courses/:course_id", updateCourse)
    app.Delete("/courses/:course_id", deleteCourse)
	app.Get("/courses/join/:course_id", joinCourse)
}

func getCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, ok := userID.(string)
	
    if !ok {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "invalid user id in token",
        })
    }

	courses, err := GetCourse(idStr)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(courses)
}

func createCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, ok := userID.(string)

	var user models.User

	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil || !ok{
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "invalid user id in token",
        })
    }

	if user.Role != "teacher" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}

	var input models.Course
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input"})
	}

	data, err := CreateCourse(idStr, input)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(data)
}

func updateCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, ok := userID.(string)
	courseID := c.Params("course_id")

	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "invalid user id in token",
        })
	}

	var course models.Course
	err := database.DB.
		Where("id = ? AND teacher_id = ?", courseID, userID).
		First(&course).Error

	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}
	
	var input map[string]interface{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input"})
	}

	data, err := UpdateCourse(idStr, courseID, input)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(data)
}

func deleteCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	courseID := c.Params("course_id")
	var user models.User
	var course models.Course
	
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil{
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "invalid user id in token",
        })
    }

	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil{
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "invalid course id",
        })
    }

	if user.Role != "admin" && course.TeacherID != user.ID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}

	if err := database.DB.Delete(&course).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "internal server error",
        })
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Course deleted successfully",
	})
}

func joinCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, ok := userID.(string)
	courseID := c.Params("course_id")

	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
            "error": "invalid user id in token",
        })
	}

	var course models.Course
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "no course",
        })
	}

	data, err := JoinCourse(idStr, &course)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(data)
}