package models

import (
	"time"
	// "gorm.io/gorm"
)

type CourseForm struct {
	Name        string `json:"name" form:"name"`
	CourseDate  string `json:"course_date" form:"course_date"`
	Section     string `json:"section" form:"section"`
	Semester    string `json:"semester" form:"semester"`
}

type AssignmentForm struct {
	Title		string		`form:"title"`
	Description	string		`form:"description"`
	Point 		int16		`form:"point"`
	StartDate 	time.Time	`form:"start"`
	DueDate		time.Time	`form:"due"`
	CloseDate 	time.Time	`form:"close"`
	Tags		[]string	`form:"tags"`
	Attachments	[]string	`form:"attachments"`
	AIAgent		*bool		`form:"ai_agent"`
	Visible		*bool		`form:"visible"`
}

type SubmissionForm struct {
	Answer     string `json:"answer" form:"answer"`
}

type CommentForm struct {
	Comment string `json:"comment" form:"comment"`
	Visible bool   `json:"visible" form:"visible"`
}

type GradeForm struct {
	Point int16 `json:"point" form:"point"`
}

type PythonCodeForm struct {
	SourceCode	string `json:"source_code" form:"source_code"`
	Input		string `json:"stdin" form:"stdin"`
}

type EnrollmentForm struct {
	Username		string	`json:"username" form:"username"`
	CourseRole		string 	`json:"course_role" form:"course_role"`
}

type EnrollmentForms struct {
	UserEnroll	[]EnrollmentForm `json:"user_enroll" form:"user_enroll"`
}

type UpdateMemberForm struct {
	NewRole		string 	`json:"new_role" form:"new_role"`
	NewStatus	string	`json:"new_status" form:"new_status"`
}

type AssignmentOverrideForm struct {
	StudentID		string 		`json:"student_id" form:"student_id"`
	ExtendedDueDate	time.Time 	`json:"extended_due_date" form:"extended_due_date"`
}