package course

import (
	"mime/multipart"
	"time"
	"gorm.io/gorm"
	"errors"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterBaseRoutes(app fiber.Router) {
	app.Post("/", createCourse)
	app.Get("/", getCourses)
}

func RegisterCourseWithIDRoutes(app fiber.Router) {
	app.Get("/", getCourse)
	app.Put("/", updateCourse)
	app.Delete("/", deleteCourse)
	app.Post("/enroll", enrollCourse)
	app.Get("/member", getMember)
	app.Put("/member/:member_id", updateMember)
	app.Delete("/member/:member_id", deleteMember)
	app.Post("/assignments", createAssignment)
	app.Get("/assignments", getAssignments)
	app.Get("/assignments/:assignment_id", getAssignment)
	app.Put("/assignments/:assignment_id", updateAssignment)
	app.Delete("/assignments/:assignment_id", deleteAssignment)
	app.Get("/assignments/:assignment_id/summary", getAssignmentSummary)
	app.Post("/assignments/:assignment_id/override/", createAssignmentOverride)
	app.Post("/assignments/:assignment_id/submission", createSubmission)
	app.Put("/assignments/:assignment_id/submission/:submission_id", updateSubmission)
	app.Post("/assignments/:assignment_id/submission/:submission_id/comment", createOrUpdateComment)
	app.Post("/assignments/:assignment_id/submission/:submission_id/comment/:comment_id", toggleComment)
	app.Put("/assignments/:assignment_id/submission/:submission_id/grade", updateGrade)
}

func createCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	if !models.HasPermission(role, "course:create") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var form models.CourseForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := CreateCourse(userID, role, &form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func getCourses(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("user_role").(string)

	courses, err := GetCourses(userID, role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"role":    role,
		"courses": courses,
	})
}

func getCourse(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	course, err := GetCourse(courseID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"role":   role,
		"course": course,
	})
}

func updateCourse(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	var course models.Course
	err := database.DB.First(&course, "id = ?", courseID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "course not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if !models.HasPermission(role, "course:update") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var form models.CourseForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := UpdateCourse(&course, &form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func deleteCourse(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	var course models.Course
	err := database.DB.First(&course, "id = ?", courseID).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "course not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	
	if !models.HasPermission(role, "course:delete") {
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
		"message": "course deleted",
	})
}

func enrollCourse(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	
	if !models.HasPermission(role, "course:enroll") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var form models.EnrollmentForms
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := EnrollCourse(courseID, &form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.JSON(data)
}

func getMember(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)
	
	if !models.HasPermission(role, "member:view_all") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	students, err := GetMember(courseID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(students)
}

func updateMember(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	memberID := c.Params("member_id")

	if !models.HasPermission(role, "member:update") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var form models.UpdateMemberForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	member, err := UpdateMember(courseID, memberID, &form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(member)
}

func deleteMember(c *fiber.Ctx) error {
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")
	memberID := c.Params("member_id")

	if !models.HasPermission(role, "member:delete") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var courseMember models.CourseMember
	if err := database.DB.First(&courseMember, "course_id = ? AND user_id_id = ?", courseID, memberID).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid course id or user id",
		})
	}

	if err := database.DB.Delete(&courseMember).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.JSON(fiber.Map{
		"message": "deleted member",
	})
}

func createAssignment(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	if !models.HasPermission(role, "assignment:create") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	multipartForm, err := c.MultipartForm()
	if err != nil && err != fiber.ErrNotFound {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid multipart form"})
	}

	var files []*multipart.FileHeader
	if multipartForm != nil {
		if uploadedFiles, ok := multipartForm.File["files"]; ok {
			files = uploadedFiles
		}
	}

	var form models.AssignmentForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	assignment, err := CreateAssignment(courseID, userID, &form, files)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(assignment)
}

func getAssignments(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	courseID := c.Params("course_id")

	assignments, err := GetAssignments(userID, courseID, role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"role":    		role,
		"assignments": 	assignments,
	})
}

func getAssignment(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	assignment, err := GetAssignment(userID, courseID, role, assignmentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.JSON(fiber.Map{
		"role": role,
		"assignment": assignment,
	})
}

func updateAssignment(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	var assignment models.Assignment
	err := database.DB.
		Where("id = ? AND course_id = ?", assignmentID, courseID).
		First(&assignment).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "assignment not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if !models.HasPermission(role, "assignment:update") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	multipartForm, err := c.MultipartForm()
	if err != nil && err != fiber.ErrNotFound {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid multipart form"})
	}

	var files []*multipart.FileHeader
	if multipartForm != nil {
		if uploadedFiles, ok := multipartForm.File["files"]; ok {
			files = uploadedFiles
		}
	}

	var form models.AssignmentForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := UpdateAssignment(&assignment, &form, files, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func deleteAssignment(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")
	
	if !models.HasPermission(role, "assignment:delete") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var assignment models.Assignment
	err := database.DB.
		Where("id = ? AND course_id = ?", assignmentID, courseID).
		First(&assignment).Error
		
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "assignment not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
		
	if err := database.DB.Delete(&assignment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "assignment deleted",
	})
}

func getAssignmentSummary(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")
	
	if !models.HasPermission(role, "assignment:view_all") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var assignment models.Assignment
	err := database.DB.
		Where("id = ? AND course_id = ?", assignmentID, courseID).
		First(&assignment).Error;
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "assignment not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	summary, err := GetAssignmentSummary(&assignment)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(summary)
}

func createAssignmentOverride(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	assignmentID := c.Locals("assignment_id").(string)
	role := c.Locals("course_role").(string)

	if !models.HasPermission(role, "assignment:update") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var assignment models.Assignment
	err := database.DB.
		Where("id = ? AND course_id = ?", assignmentID, courseID).
		First(&assignment).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "submission not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	var form models.AssignmentOverrideForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	_, err = CreateAssignmentOverride(assignmentID , form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "override assignment",
	})
}

func createSubmission(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	assignmentID := c.Params("assignment_id")

	if !models.HasPermission(role, "submission:create") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var assignment models.Assignment
	err := database.DB.
		Where("id = ? AND course_id = ?", assignmentID, courseID).
		First(&assignment).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "assignment not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	now := time.Now()

	if !assignment.Visible {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "assignment not visible",
		})
	}

	effectiveCloseDate := assignment.CloseDate

	var override models.AssignmentOverride
	err = database.DB.
		Select("extended_due_date").
		Where("assignment_id = ? AND student_id = ?", assignmentID, userID).
		Take(&override).Error

	if err == nil {
		effectiveCloseDate = override.ExtendedDueDate
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if effectiveCloseDate.Before(now) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "assignment is closed",
		})
	}

	var form models.SubmissionForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form",
		})
	}

	file, _ := c.FormFile("file")

	submission, err := CreateSubmission(assignmentID, userID, &form, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(submission)
}

func updateSubmission(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	submissionID := c.Params("submission_id")
	role := c.Locals("course_role").(string)
	
	if !models.HasPermission(role, "submission:update") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var submission models.Submission
	err := database.DB.
		Preload("Assignment").
		Where("id = ? AND student_id = ?", submissionID, userID).
		First(&submission).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "submission not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if !submission.Assignment.Visible {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "assignment not visible",
		})
	}

	now := time.Now()

	effectiveCloseDate := submission.Assignment.CloseDate

	var override models.AssignmentOverride
	err = database.DB.
		Select("extended_due_date").
		Where("assignment_id = ? AND student_id = ?", submission.AssignmentID, userID).
		Take(&override).Error

	if err == nil {
		effectiveCloseDate = override.ExtendedDueDate
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if effectiveCloseDate.Before(now) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "assignment is closed",
		})
	}

	file, _ := c.FormFile("file")

	var form models.SubmissionForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form",
		})
	}

	data, err := UpdateSubmission(&submission, &form, file, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func createOrUpdateComment(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	userID := c.Locals("user_id").(string)
	role := c.Locals("course_role").(string)
	submissionID := c.Params("submission_id")

	if !models.HasPermission(role, "assignment:comment") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var submission models.Submission
	err := database.DB.
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Where("submissions.id = ? AND assignments.course_id = ?", submissionID, courseID).
		First(&submission).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "submission not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	var form models.CommentForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form",
		})
	}

	data, err := CreateOrUpdateComment(submissionID, userID, role, &form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func toggleComment (c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	submissionID := c.Params("submission_id")
	role := c.Locals("course_role").(string)
	commentID := c.Params("comment_id")

	if !models.HasPermission(role, "assignment:comment") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var submission models.Submission
	err := database.DB.
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Where("submissions.id = ? AND assignments.course_id = ?", submissionID, courseID).
		First(&submission).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "submission not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	var comment models.Comment
	if err := database.DB.First(&comment, "id = ?", commentID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "no comment or no access",
		})
	}

	data, err := ToggleComment(&comment, role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func updateGrade(c *fiber.Ctx) error {
	courseID := c.Params("course_id")
	role := c.Locals("course_role").(string)
	submissionID := c.Params("submission_id")

	if !models.HasPermission(role, "assignment:grade") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}
	
	var submission models.Submission
	err := database.DB.
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Where("submissions.id = ? AND assignments.course_id = ?", submissionID, courseID).
		First(&submission).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "submission not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	var form models.GradeForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form",
		})
	}
	
	if !canGradeSubmission(role, &submission) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid role",
		})
	}

	updates := map[string]any{}

	updates["point"] = form.Point
	updates["graded_by"] = role

	if err := database.DB.Model(&submission).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": err,
		})
	}

	data := map[string]any{
		"submission_id":	submissionID,
		"point":     		updates["point"],
		"graded_by": 		updates["graded_by"],
	}

	return c.JSON(data)
}

//helper
func canGradeSubmission(role string, s *models.Submission) bool {

	switch role {

	case "teacher":
		return true

	case "ta":
		if s.GradedBy == nil {
			return true
		}
		return *s.GradedBy == "ai"

	default:
		return false
	}
}