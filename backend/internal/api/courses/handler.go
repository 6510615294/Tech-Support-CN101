package course

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
    app.Get("/courses", getCourse)
	app.Get("/courses/:course_id", getACourse)
    app.Post("/courses", createCourse)
    app.Put("/courses/:course_id", updateCourse)
    app.Delete("/courses/:course_id", deleteCourse)
	app.Get("/courses/join/:course_id", joinCourse)
	app.Get("/courses/:course_id/students", getStudent)
	app.Post("/courses/:course_id/students/:student_id", changeStudentStatus)
	// app.Get("/courses/:course_id/assignments", getAssignment)
	// app.Post("/courses/:course_id/assignments", createAssignment)
	// app.Get("/courses/:course_id/assignments/:assignment_id", getAAssignment)
	// app.Put("/courses/:course_id/assignments/:assignment_id", updateAssignment)
	// app.Delete("/courses/:course_id/assignments/:assignment_id", deleteAssignment)
	// app.Post("/courses/:course_id/assignments/:assignment_id/upload", uploadAssignment)
	// app.Post("/courses/:course_id/assignments/:assignment_id/submit", submitAssignment)
	// Grade
	// app.Get("/courses/:course_id/resources", getResourse)
	// app.Post("/courses/:course_id/resources", addResourse)
	// app.Put("/courses/:course_id/resources", updateResourse)
}

func isInCourse(userID, courseID string) bool {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return false
	}

	switch user.Role {
	case "student":
		var enrollment models.Enrollment
		if err := database.DB.Where("course_id = ? AND student_id = ?", courseID, userID).First(&enrollment).Error; err != nil {
			return false
		}

	case "teacher":
		var course models.Course
		if err := database.DB.Where("teacher_id = ?", userID).First(&course).Error; err != nil {
			return false
		}

	default:
		return false
	}

	return true
}

func getRole(userID string) string {
	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		return ""
	}

	return string(user.Role)
}

func getCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)

	courses, err := GetCourse(idStr)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(courses)
}

func getACourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	if !isInCourse(idStr, courseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}

	course, err := GetACourse(idStr, courseID)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(course)
}

func createCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)

	if getRole(idStr) != "teacher" {
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
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	var course models.Course
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": "internal server error",
        })
	}

	if getRole(idStr) != "admin" && course.TeacherID != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}
	
	var input map[string]interface{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input"})
	}

	data, err := UpdateCourse(course, input)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(data)
}

func deleteCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	var course models.Course
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil{
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "invalid course id",
        })
    }

	if getRole(idStr) != "admin" && course.TeacherID != idStr {
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
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

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

func getStudent(c *fiber.Ctx) error  {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	if !isInCourse(idStr, courseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}

	students, err := GetStudent(courseID)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(students)
}

func changeStudentStatus(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string) 
	courseID := c.Params("course_id")
	studentID := c.Params("student_id")

	var course models.Course
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil{
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
            "error": "invalid course id",
        })
    }

	if getRole(idStr) != "admin" && course.TeacherID != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
            "error": "no access",
        })
	}

	var input map[string]interface{}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid input"})
	}

	enrollment, err := ChangeStudentStatus(courseID, studentID, input)
	if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    return c.JSON(enrollment)
}

// func getAssignment(c *fiber.Ctx) error {
// 	userID := c.Locals("user_id")
// 	idStr, _ := userID.(string)
// 	courseID := c.Params("course_id")

// 	if !isInCourse(idStr, courseID) {
// 		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
//             "error": "no access",
//         })
// 	}
// }