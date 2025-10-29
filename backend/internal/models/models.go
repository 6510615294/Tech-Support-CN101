package models

import (
	"time"
	"gorm.io/gorm"
)

type Role string

const (
	RoleTeacher             Role = "teacher"
	RoleStudent             Role = "student"
	RoleTeacherAssistance   Role = "teacher assistance"
	RoleAdmin               Role = "admin"
)

type User struct {
	ID         	string         	`gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Username   	string         	`gorm:"unique;not null" json:"username"`
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