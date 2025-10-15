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
	ID         string         `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Username   string         `gorm:"unique;not null" json:"username"`
	ThaiName   string         `json:"thai_name"`
	EngName    string         `json:"eng_name"`
	Email      string         `gorm:"unique;not null" json:"email"`
	Department string         `json:"department"`
	Extra      string         `json:"extra"`
	Role       Role           `gorm:"type:VARCHAR(20);not null" json:"role"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
