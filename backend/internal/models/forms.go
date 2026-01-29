package models

import (
	"time"
	// "gorm.io/gorm"
)

type CourseForm struct {
	Name		string		`form:"name"`
	CourseDate	string		`form:"course_date"`
	Section		string		`form:"section"`
	Semester	string		`form:"semester"`
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
	Assignment		string			`form:"assignment"`
	Answer			string			`form:"answer"`
	Attachment		string			`form:"attachment"`
}

type CommentForm struct {
	Comment 		string			`form:"comment"`
	Point 			int16			`form:"point"`
	Visible			*bool			`form:"visible"`
}

type GradeForm struct {
	Point *int16 `form:"point"` 
}