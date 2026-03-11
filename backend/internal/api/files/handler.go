package file

import (
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
	app.Get("/files/submission/:submission_id", getSubmission)
	app.Get("/files/assignment/:assignment_id/submissions/download", downloadSubmissions)
}

func getSubmission(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)
	submissionID := c.Params("submission_id")
	
	var submission models.Submission

	err := database.DB.
    	Preload("Attachment").
	    First(&submission, "id = ?", submissionID).Error
	
	if err != nil {
	    return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "submission not found",
		})
	}
	
	allowed :=
		models.HasPermission(role, "file:read_all") ||
		(models.HasPermission(role, "file:read_own") &&
			submission.StudentID == userID)

	if !allowed {
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

func downloadSubmissions(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	assignmentID := c.Params("assignment_id")
	
	var role string

	err := database.DB.
		Table("assignments").
		Select("cm.role").
		Joins("JOIN course_members cm ON cm.course_id = assignments.course_id").
		Where(`
			assignments.id = ? 
			AND cm.user_id = ? 
			AND cm.status = ?
		`, assignmentID, userID, "active").
		Scan(&role).Error
	
	if err != nil || role == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "user not in this course",
		})
	}
	
	if !models.HasPermission(role, "file:dowload_all") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	zip, err := DownloadSubmissions(assignmentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	
	c.Set("Content-Type", "application/zip")
	c.Set("Content-Disposition", "attachment; filename=submissions.zip")
	
	return c.Send(zip)
}