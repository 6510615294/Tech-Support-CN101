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
