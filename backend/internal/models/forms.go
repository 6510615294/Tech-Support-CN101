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
	Attachment	string		`form:"attachment"`
	Visible		*bool		`form:"visible"`
}

type SubmissionForm struct {
	Answer     string `json:"answer" form:"answer"`
	Attachment string `json:"attachment" form:"attachment"`
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