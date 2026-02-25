package file

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
	app.Get("/files/submission/:submission_id", getSubmission)
}

func getRole(userID string) models.Role {
	var role models.Role
	database.DB.Model(&models.User{}).
		Select("role").
		Where("id = ?", userID).
		Scan(&role)

	return role
}

func isInCourse(userID, courseID string, role models.Role) bool {
	switch role {
	case models.RoleStudent, models.RoleTeacherAssistance:
		var exists int
		err := database.DB.Model(&models.Enrollment{}).
			Select("1").
			Where("course_id = ? AND student_id = ?", courseID, userID).
			Limit(1).
			Scan(&exists).Error
		return err == nil && exists == 1
	
	case models.RoleTeacher:
		var exists int
		err := database.DB.Model(&models.Course{}).
			Select("1").
			Where("id = ? AND teacher_id = ?", courseID, userID).
			Limit(1).
			Scan(&exists).Error
		return err == nil && exists == 1
	
	case models.RoleAI:
		return true
	
	default:
		return false
	}
}

func getSubmission(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	userRole := getRole(idStr)
	submissionID := c.Params("submission_id")
	
	var submission models.Submission

	err := database.DB.
  		Preload("Assignment").
    	Preload("Attachment").
	    First(&submission, "id = ?", submissionID).Error
	
	if err != nil {
	    return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "submission not found",
		})
	}
	
	if !isInCourse(idStr, submission.Assignment.CourseID, userRole) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	if submission.Attachment == nil {
	    return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "attachment not found",
		})
	}
	
	content, err := database.ReadPythonFileFromS3ByKey(submission.Attachment.FileKey)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	
	return c.JSON(content)
}