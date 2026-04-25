package models

import (
	"time"
	// "gorm.io/gorm"
)

type LoginForm struct {
	Username string `json:"username" example:"6512345678"`
	Password string `json:"password" example:"mypassword"`
}

type CourseForm struct {
	Name       string `json:"name" form:"name"`
	Schedule   string `json:"schedule" form:"schedule"`
	Section    string `json:"section" form:"section"`
	Semester   string `json:"semester" form:"semester"`
}

type AssignmentForm struct {
	Title       		string    	`form:"title"`
	Description 		string    	`form:"description"`
	Point       		int16     	`form:"point"`
	StartDate   		time.Time 	`form:"start"`
	DueDate     		time.Time 	`form:"due"`
	CloseDate   		time.Time 	`form:"close"`
	Tags        		[]string  	`form:"tags"`
	Attachments 		[]string  	`form:"attachments"`
	AIAgent     		bool      	`form:"ai_agent"`
	AssignmentPrompt	string		`form:"assignment_prompt"`
	Visible     		bool      	`form:"visible"`
}

type SubmissionForm struct {
	Answer string `json:"answer" form:"answer"`
}

type CommentForm struct {
	Comment string `json:"comment" form:"comment"`
	Visible bool   `json:"visible" form:"visible"`
}

type GradeForm struct {
	Point int16 `json:"point" form:"point"`
}

type GradeAndCommentForm struct {
	Point 	int16 	`json:"point" form:"point"`
	Comment string 	`json:"comment" form:"comment"`
	Visible bool   	`json:"visible" form:"visible"`
}

type PythonCodeForm struct {
	SourceCode string `json:"source_code" form:"source_code"`
	Input      string `json:"stdin" form:"stdin"`
}

type EnrollmentForm struct {
	Username   string `json:"username" form:"username"`
	CourseRole string `json:"course_role" form:"course_role"`
}

type EnrollmentForms struct {
	UserEnroll []EnrollmentForm `json:"user_enroll" form:"user_enroll"`
}

type UpdateMemberForm struct {
	NewRole   string `json:"new_role" form:"new_role"`
	NewStatus string `json:"new_status" form:"new_status"`
}

type AssignmentOverrideForm struct {
	StudentID       string    `json:"student_id" form:"student_id"`
	ExtendedDueDate time.Time `json:"extended_due_date" form:"extended_due_date"`
}

type AssignmentTemplateForm struct {
	Title       		string   	`json:"title" form:"title"`
	Description 		string   	`json:"description" form:"description"`
	Point       		int16    	`json:"point" form:"point"`
	Tags        		[]string 	`json:"tags" form:"tags"`
	Attachments 		[]string 	`json:"attachments" form:"attachments"`
	AIAgent     		bool      	`form:"ai_agent"`
	AssignmentPrompt	string		`form:"assignment_prompt"`
}

type AIConfigForm struct {
	Provider       string  `json:"provider" form:"provider"`
	Model          string  `json:"model" form:"model"`
	APIKey         string  `json:"api_key" form:"api_key"`
	BaseURL        string  `json:"base_url" form:"base_url"`
	Temperature    float32 `json:"temperature" form:"temperature"`
}

type AssignmentPromptForm struct {
	Prompt string `json:"prompt" form:"prompt"`
}

type AISubmissionForm struct {
	SubmissionID string `json:"id"`
	Answer       string `json:"answer"`
}

type AIForm struct {
	AIConfig         ResponseAIConfig `json:"config"`
	MaxPoint         int16            `json:"max_point"`
	AssignmentPrompt string           `json:"prompt"`
	Submissions      []AISubmissionForm  `json:"submissions"`
}

type AIGradingForm struct {
	SubmissionID string `json:"id"`
	Comment      string `json:"comment"`
	Point        int16  `json:"point"`
}

type AIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}
