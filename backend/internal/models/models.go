package models

import (
	"time"
	"gorm.io/gorm"
)

type Role string

const (
	RoleTeacher             Role = "teacher"
	RoleStudent             Role = "student"
	RoleTeacherAssistance   Role = "ta"
	RoleAdmin               Role = "admin"
	RoleAI               	Role = "ai"
)

type User struct {
	ID         	string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Username   	string         	`gorm:"unique;not null" json:"username"`
	ThName		string			`gorm:"default:ชื่อ สกุล" json:"th_name"`
	EnName		string			`gorm:"default:Name Surname" json:"en_name"`
	UserType   	string		  	`json:"user_type"`
	Role       	Role           	`gorm:"type:VARCHAR(20);not null" json:"role"`
	Email      	string		  	`gorm:"unique;not null" json:"email"`
	CreatedAt  	time.Time      	`json:"created_at"`
	UpdatedAt  	time.Time      	`json:"updated_at"`
	DeletedAt  	gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type Course struct {
	ID        	string         	`gorm:"primaryKey;size:6" json:"id"`
	Name       	string         	`gorm:"unique;not null" json:"name"`
	CourseDate 	string         	`gorm:"type:varchar(20);not null" json:"course_date"`
	Section    	string         	`gorm:"not null" json:"section"`
	Semester   	string         	`gorm:"not null" json:"semester"`
	TeacherID  	string         	`gorm:"not null" json:"teacher_id"`
	Teacher    	User           	`gorm:"foreignKey:TeacherID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	CreatedAt  	time.Time      	`json:"created_at"`
	UpdatedAt  	time.Time      	`json:"updated_at"`
	DeletedAt  	gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type Enrollment struct {
	ID         	string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Status		string			`gorm:"not null" json:"status"`
	CourseID	string			`gorm:"not null" json:"course_id"`
	Course		Course			`gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	StudentID  	string         	`gorm:"not null" json:"student_id"`
	Student    	User           	`gorm:"foreignKey:StudentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	CreatedAt  	time.Time      	`json:"created_at"`
	UpdatedAt  	time.Time      	`json:"updated_at"`
	DeletedAt  	gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type StudentWithEnrollment struct {
    User
    EnrollmentStatus string `json:"enrollment_status" gorm:"column:status"`
}

type Attachment struct {
	ID          string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	URL         string         	`gorm:"not null" json:"url"`
	FileKey 	string 			`gorm:"not null" json:"-"`
	FileName    string         	`json:"file_name"`
	FileType    string         	`json:"file_type"`
	UserID  	string         	`gorm:"not null" json:"user_id"`
	Uploader 	User 			`gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	CreatedAt   time.Time      	`json:"created_at"`
	DeletedAt   gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type Tag struct {
	ID        	string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      	string         	`gorm:"unique;not null" json:"name"`
	CreatedAt 	time.Time      	`json:"created_at"`
	DeletedAt 	gorm.DeletedAt 	`gorm:"index" json:"-"`
}

type Assignment struct {
	ID          	string			`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	CourseID		string			`gorm:"not null" json:"course_id"`
	Course			Course			`gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Title       	string         	`gorm:"not null" json:"title"`
	Description 	string         	`json:"description"`
	Point       	int16        	`json:"point"`
	StartDate   	time.Time      	`json:"start_date"`
	DueDate     	time.Time      	`json:"due_date"`
	CloseDate   	time.Time      	`json:"close_date"`
	AttachmentID 	*string     	`gorm:"null" json:"attachment_id,omitempty"`
	Attachment   	*Attachment 	`gorm:"foreignKey:AttachmentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
	Tags        	[]Tag          	`gorm:"many2many:assignment_tags;" json:"tags"`
	CreatedAt   	time.Time      	`json:"created_at"`
	CreatedBy   	string         	`json:"created_by"`
	DeletedAt		gorm.DeletedAt 	`gorm:"index" json:"-"`
	Visible			bool			`gorm:"default:true" json:"visible"`
}

type Comment struct {
	ID        		string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	SubmissionID 	string         	`gorm:"not null;index" json:"submission_id"`
	Comment     	string         	`gorm:"not null" json:"comment"`
	CreatedByRole 	Role			`gorm:"type:VARCHAR(20);not null" json:"created_by_role"`
	CreatedBy   	string         	`json:"created_by"`
	CreatedAt 		time.Time      	`json:"created_at"`
	DeletedAt 		gorm.DeletedAt 	`gorm:"index" json:"-"`
	Visible			bool			`gorm:"default:true" json:"visible"`
}

type Submission struct {
	ID          	string			`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AssignmentID	string			`gorm:"not null" json:"assignment_id"`
	Assignment		Assignment		`gorm:"foreignKey:AssignmentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`
	Answer 			string         	`json:"answer"`
	Point         	*int16         	`gorm:"null" json:"point,omitempty"`
	GradedBy      	*string         `gorm:"type:VARCHAR(20);null" json:"graded_by,omitempty"`
	AttachmentID 	*string     	`gorm:"null" json:"attachment_id,omitempty"`
	Attachment   	*Attachment 	`gorm:"foreignKey:AttachmentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"-"`
	Comments		[]Comment		`gorm:"foreignKey:SubmissionID;constraint:OnDelete:CASCADE;" json:"comments"`
	Submitter 		User   			`gorm:"foreignKey:CreatedBy;references:ID" json:"-"`
	CreatedBy   	string         	`json:"created_by"`
	CreatedAt   	time.Time      	`json:"created_at"`
	DeletedAt		gorm.DeletedAt 	`gorm:"index" json:"-"`
}