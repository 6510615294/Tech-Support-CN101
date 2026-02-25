package course

import (
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(app fiber.Router) {
	app.Get("/courses", getCourses)
	app.Get("/courses/:course_id", getCourse)
	app.Post("/courses", createCourse)
	app.Put("/courses/:course_id", updateCourse)
	app.Delete("/courses/:course_id", deleteCourse)
	app.Get("/courses/join/:course_id", joinCourse)
	app.Get("/courses/:course_id/students", getStudents)
	app.Post("/courses/:course_id/students/:student_id", changeStudentStatus)
	app.Get("/courses/:course_id/assignments", getAssignments)
	app.Get("/courses/:course_id/assignments/:assignment_id", getAssignment)
	app.Post("/courses/:course_id/assignments", createAssignment)
	app.Put("/courses/:course_id/assignments/:assignment_id", updateAssignment)
	app.Delete("/courses/:course_id/assignments/:assignment_id", deleteAssignment)
	app.Post("/courses/:course_id/assignments/:assignment_id/submission", createSubmission)
	app.Put("/courses/:course_id/assignments/:assignment_id/submission/:submission_id", updateSubmission)
	// app.Delete("/courses/:course_id/assignments/:assignment_id/submission", deleteSubmission)
	app.Post("/courses/:course_id/assignments/:assignment_id/submission/:submission_id/comment", createOrUpdateComment)
	app.Post("/courses/:course_id/assignments/:assignment_id/submission/:submission_id/comment/:comment_id", toggleComment)
	app.Put("/courses/:course_id/assignments/:assignment_id/submission/:submission_id/grade", updateGrade)
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
		
	case "ta":
		var enrollment models.Enrollment
		if err := database.DB.Where("course_id = ? AND student_id = ?", courseID, userID).First(&enrollment).Error; err != nil {
			return false
		}

	case "teacher":
		var course models.Course
		if err := database.DB.Where("teacher_id = ?", userID).First(&course).Error; err != nil {
			return false
		}
		
	case "ai":
		return true

	default:
		return false
	}

	return true
}

func getRole(userID string) string {
	var role string
	database.DB.Model(&models.User{}).
		Select("role").
		Where("id = ?", userID).
		Scan(&role)

	return role
}

func getCourses(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	userRole := getRole(idStr)

	courses, err := GetCourses(idStr, userRole)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"role":    userRole,
		"courses": courses,
	})
}

func getCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	if !isInCourse(idStr, courseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	course, err := GetCourse(courseID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

		return c.JSON(fiber.Map{
			"role":    getRole(idStr),
			"course": course,
	})
}

func createCourse(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)

	if getRole(idStr) != "teacher" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var form models.CourseForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := CreateCourse(idStr, form)
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

	var form models.CourseForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := UpdateCourse(course, form)
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
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
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
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
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

func getStudents(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	if !isInCourse(idStr, courseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	students, err := GetStudents(courseID)
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
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid course id",
		})
	}

	if getRole(idStr) != "admin" && course.TeacherID != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var form map[string]interface{}
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	enrollment, err := ChangeStudentStatus(courseID, studentID, form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(enrollment)
}

func createAssignment(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	var course models.Course
	if err := database.DB.First(&course, "id = ?", courseID).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "invalid course id"})
	}

	if getRole(idStr) != "admin" && course.TeacherID != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "no access"})
	}

	file, _ := c.FormFile("file")

	var form models.AssignmentForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	assignment, err := CreateAssignment(courseID, idStr, &form, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(assignment)
}

func getAssignments(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")

	if !isInCourse(idStr, courseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	assignments, err := GetAssignments(courseID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"role":    getRole(idStr),
		"assignments": assignments,
	})
}

func getAssignment(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	courseID := c.Params("course_id")
	assignmentID := c.Params("assignment_id")
	userRole := getRole(idStr)
	
	if !isInCourse(idStr, courseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	assignment, err := GetAssignment(idStr, userRole, assignmentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"role": userRole,
		"data": assignment,
	})
}

func updateAssignment(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	assignmentID := c.Params("assignment_id")

	var assignment models.Assignment
	if err := database.DB.First(&assignment, "id = ?", assignmentID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if getRole(idStr) != "admin" && assignment.CreatedBy != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	file, _ := c.FormFile("file")

	var form models.AssignmentForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := UpdateAssignment(assignment, form, file, idStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func deleteAssignment(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	assignmentID := c.Params("assignment_id")

	var assignment models.Assignment
	if err := database.DB.First(&assignment, "id = ?", assignmentID).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid assignment id",
		})
	}

	if getRole(idStr) != "admin" && assignment.CreatedBy != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	if err := database.DB.Delete(&assignment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Assignment deleted successfully",
	})
}

func createSubmission(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	role := getRole(userID)

	assignmentID := c.Params("assignment_id")

	if role != "student" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var assignment models.Assignment
	if err := database.DB.First(&assignment, "id = ?", assignmentID).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid assignment id",
		})
	}

	if !isInCourse(userID, assignment.CourseID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	if !assignment.Visible || assignment.CloseDate.Before(time.Now()) {
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

	submission, err := CreateSubmission(assignment.ID, userID, &form, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(submission)
}

func updateSubmission(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	idStr, _ := userID.(string)
	submissionID := c.Params("submission_id")

	var submission models.Submission
	if err := database.DB.First(&submission, "id = ?", submissionID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	if getRole(idStr) != "admin" && submission.CreatedBy != idStr {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	file, _ := c.FormFile("file")

	var form models.SubmissionForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid form"})
	}

	data, err := UpdateSubmission(submission, form, file, idStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func createOrUpdateComment(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	role := getRole(userID)
	submissionID := c.Params("submission_id")

	if role == "student" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var submission models.Submission
	query := database.DB.
		Joins("JOIN assignments a ON a.id = submissions.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("submissions.id = ?", submissionID)

	switch role {

	case "teacher":
		query = query.Where("c.teacher_id = ?", userID)

	case "ta":
		query = query.
			Joins("JOIN enrollments e ON e.course_id = c.id").
			Where("e.student_id = ?", userID)

	case "ai":

	default:
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid role",
		})
	}

	if err := query.First(&submission).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "submission not found or no access",
		})
	}

	var form models.CommentForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form",
		})
	}

	data, err := CreateOrUpdateComment(&submission, userID, role, &form)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(data)
}

func toggleComment (c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	role := getRole(userID)
	commentID := c.Params("comment_id")

	if role == "student" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var comment models.Comment

	query := database.DB.
		Model(&models.Comment{}).
		Joins("JOIN submissions s ON s.id = comments.submission_id").
		Joins("JOIN assignments a ON a.id = s.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("comments.id = ?", commentID)
	
	switch role {
	
	case "teacher":
		query = query.Where("c.teacher_id = ?", userID)
	
	case "ta":
		query = query.
			Joins("JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?", userID)
	
	case "ai":
		// AI has no additional restriction
	
	default:
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid role",
		})
	}
	
	if err := query.First(&comment).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "comment not found or no access",
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
	userID, _ := c.Locals("user_id").(string)
	role := getRole(userID)
	submissionID := c.Params("submission_id")

	if role == "student" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "no access",
		})
	}

	var submission models.Submission
	query := database.DB.
		Joins("JOIN assignments a ON a.id = submissions.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("submissions.id = ?", submissionID)

	switch role {

	case "teacher":
		query = query.Where("c.teacher_id = ?", userID)

	case "ta":
		query = query.
			Joins("JOIN enrollments e ON e.course_id = c.id").
			Where("e.student_id = ?", userID)

	case "ai":

	default:
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid role",
		})
	}

	if err := query.First(&submission).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "submission not found or no access",
		})
	}

	var form models.GradeForm
	if err := c.BodyParser(&form); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid form",
		})
	}

	var gradable bool
	var prev models.Role
	
	if submission.GradedBy == nil {
			gradable = true
	} else {
			prev = models.Role(*submission.GradedBy)
	}
	
	switch models.Role(role) {
	case models.RoleTeacher:
			gradable = true
	
	case models.RoleTeacherAssistance:
			if submission.GradedBy != nil {
				gradable = (prev == models.RoleAI)
			} else {
				gradable = true
			}
	
	case models.RoleAI:
			gradable = false
	
	default:
			gradable = false
	}
	
	if !gradable {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "invalid role",
			})
	}

	updates := map[string]interface{}{}

	updates["point"] = form.Point
	updates["graded_by"] = role

	if err := database.DB.Model(&submission).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": err,
		})
	}

	data := map[string]interface{}{
		"point":     updates["point"],
		"graded_by": updates["graded_by"],
	}

	return c.JSON(data)
}
