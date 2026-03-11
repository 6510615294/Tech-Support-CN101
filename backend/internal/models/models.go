package models

import (
	"time"
	"slices"
	// "gorm.io/gorm"
)

type Role string

const (
	RoleTeacher             Role = "teacher"
	RoleStudent             Role = "student"
	RoleTeacherAssistance   Role = "ta"
	RoleAdmin               Role = "admin"
	RoleAI               	Role = "ai"
)

type Status string

const (
	StatusActive   Status = "active"
	StatusInactive Status = "inactive"
	StatusWithdraw Status = "withdraw"
	StatusDrop     Status = "drop"
)

var RolePermissions = map[string][]string{
	"teacher": {
		"course:create",
		"course:view_own",
		"course:update",
		"course:delete",
		"course:enroll",
		"member:view_all",
		"member:update",
		"member:delete",
		"assignment:create",
		"assignment:view_all",
		"assignment:update",
		"assignment:delete",
		"assignment:comment",
		"assignment:comment_any",
		"assignment:grade",
		"submission:view_all",
		"file:read_all",
		"file:dowload_all",
	},
	"student": {
		"course:view_own",
		"assignment:view_visible",
		"submission:create",
		"submission:view_own",
		"submission:update",
		"submission:delete",
		"file:read_own",
	},
}

func HasPermission(role string, permission string) bool {
	return slices.Contains(RolePermissions[role], permission)
}

type User struct {
	ID         	string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Username   	string         	`gorm:"unique;not null;index" json:"username"`
	ThName		string			`gorm:"default:ชื่อ สกุล" json:"th_name"`
	EnName		string			`gorm:"default:Name Surname" json:"en_name"`
	UserType   	string		  	`json:"user_type"`
	Role       	Role           	`gorm:"type:VARCHAR(20);not null" json:"role"`
	Email      	string		  	`gorm:"unique;not null" json:"email"`
	CreatedAt  	time.Time      	`json:"created_at"`
	UpdatedAt  	time.Time      	`json:"updated_at"`
	// DeletedAt  	gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type Course struct {
	ID        	string         	`gorm:"primaryKey;size:6" json:"id"`
	Name       	string         	`gorm:"unique;not null" json:"name"`
	CourseDate 	string         	`gorm:"type:varchar(20);not null" json:"course_date"`
	Section    	string         	`gorm:"not null" json:"section"`
	Semester   	string         	`gorm:"not null" json:"semester"`
	TeacherID  	string         	`gorm:"not null;index" json:"teacher_id"`
	Teacher    	User           	`gorm:"foreignKey:TeacherID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	CreatedAt  	time.Time      	`json:"created_at"`
	UpdatedAt  	time.Time      	`json:"updated_at"`
	// DeletedAt  	gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type CourseMember struct {
	ID        	string 			`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    	string 			`gorm:"not null;index" json:"user_id"`
	CourseID  	string 			`gorm:"not null;index" json:"course_id"`
	Role      	string 			`gorm:"type:varchar(20);not null" json:"role"`
	Status    	string 			`gorm:"not null" json:"status"`
	User      	User   			`gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Course    	Course 			`gorm:"foreignKey:CourseID;constraint:OnDelete:CASCADE" json:"-"`
	CreatedAt  	time.Time      	`json:"created_at"`
	UpdatedAt  	time.Time      	`json:"updated_at"`
}

type Attachment struct {
	ID          string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	URL         string         	`gorm:"not null" json:"url"`
	FileKey 	string 			`gorm:"not null" json:"-"`
	FileName    string         	`json:"file_name"`
	FileType    string         	`json:"file_type"`
	UserID  	string         	`gorm:"not null;index" json:"user_id"`
	Uploader 	User 			`gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	CreatedAt   time.Time      	`json:"created_at"`
	// DeletedAt   gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type Tag struct {
	ID        	string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      	string         	`gorm:"unique;not null" json:"name"`
	CreatedAt 	time.Time      	`json:"created_at"`
}

type Assignment struct {
	ID          	string			`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	CourseID		string			`gorm:"not null;index" json:"course_id"`
	Course			Course			`gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Title       	string         	`gorm:"not null" json:"title"`
	Description 	string         	`json:"description"`
	Point       	int16        	`json:"point"`
	StartDate   	time.Time      	`json:"start_date"`
	DueDate     	time.Time      	`json:"due_date"`
	CloseDate   	time.Time      	`json:"close_date"`
	Attachments  	[]Attachment   	`gorm:"many2many:assignment_attachments;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"attachments"`
	Tags        	[]Tag          	`gorm:"many2many:assignment_tags;" json:"tags"`
	AIAgent			bool			`gorm:"default:false" json:"ai_agent"`
	CreatedAt   	time.Time      	`json:"created_at"`
	UpdatedAt 		time.Time      	`json:"updated_at"`
	// DeletedAt		gorm.DeletedAt 	`gorm:"index" json:"-"`
	Visible			bool			`gorm:"default:true" json:"visible"`
}

type AssignmentOverride struct {
	ID            		string    		`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AssignmentID  		string    		`gorm:"not null" json:"assignment_id"`
	Assignment    		Assignment 		`gorm:"foreignKey:AssignmentID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
	StudentID			string			`gorm:"not null;index" json:"student_id"`
	Student    			User 			`gorm:"foreignKey:StudentID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
	ExtendedDueDate     time.Time      	`json:"extended_due_date"`
}

type Comment struct {
	ID        		string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SubmissionID 	string         	`gorm:"not null;index" json:"submission_id"`
	Comment     	string         	`gorm:"not null" json:"comment"`
	CreatedByRole 	Role			`gorm:"type:VARCHAR(20);not null" json:"created_by_role"`
	CreatedBy   	string         	`json:"created_by"`
	CreatedAt  		time.Time      	`json:"created_at"`
	UpdatedAt 		time.Time      	`json:"updated_at"`
	// DeletedAt 		gorm.DeletedAt 	`gorm:"index" json:"-"`
	Visible			bool			`gorm:"default:true" json:"visible"`
}

type Submission struct {
	ID          	string			`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AssignmentID	string			`gorm:"not null;index" json:"assignment_id"`
	Assignment		Assignment		`gorm:"foreignKey:AssignmentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Answer 			string         	`json:"answer"`
	Point         	*int16         	`gorm:"null" json:"point,omitempty"`
	GradedBy      	*string         `gorm:"type:VARCHAR(20);null" json:"graded_by,omitempty"`
	AttachmentID 	*string     	`gorm:"null" json:"attachment_id,omitempty"`
	Attachment   	*Attachment 	`gorm:"foreignKey:AttachmentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
	Comments		[]Comment		`gorm:"foreignKey:SubmissionID;constraint:OnDelete:CASCADE;" json:"comments"`
	StudentID    	string 			`gorm:"not null;index" json:"student_id"`
	Student      	User   			`gorm:"foreignKey:StudentID;references:ID" json:"-"`
	CreatedAt   	time.Time      	`json:"created_at"`
	UpdatedAt 		time.Time      	`json:"updated_at"`
	// DeletedAt		gorm.DeletedAt 	`gorm:"index" json:"-"`
}