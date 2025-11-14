package me

import (
	"encoding/json"
	"log"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/go-resty/resty/v2"
)

func GetUserData(userID string) (*models.ResponseUserData, error) {
	studentURL := "https://restapi.tu.ac.th/api/v2/profile/std/info/?id="
	teacherURL := "https://restapi.tu.ac.th/api/v2/profile/Instructors/info/?Email="
	var url string
	var user models.User
	
	err := database.DB.Where("id = ?", userID).First(&user).Error
	if err != nil {
		return nil, err
	} else if user.UserType == "student" {
		url = studentURL + user.Username
	} else {
		url = teacherURL + user.Email
	}

	client := resty.New()
	apiKey := config.GetEnv("TU_API")
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Application-Key", apiKey).
		Get(url)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	var root struct {
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(resp.Body(), &root); err != nil {
		return nil, err
	}

	type StudentData struct {
		ThName 		string `json:"displayname_th"`
		EnName 		string `json:"displayname_en"`
		Email       string `json:"email"`
		Faculty     string `json:"faculty"`
	}

	type InstructorData struct {
		FirstNameTh string `json:"First_Name_Th"`
		LastNameTh  string `json:"Last_Name_Th"`
		FirstNameEn string `json:"First_Name_En"`
		LastNameEn  string `json:"Last_Name_En"`
		Email       string `json:"Email"`
		Faculty     string `json:"Faculty_Name_Th"`
	}

	var response models.ResponseUserData
	response.Username = user.Username
	response.Role = string(user.Role)

	if user.UserType == "student" {
		var student StudentData
		if err := json.Unmarshal(root.Data, &student); err != nil {
			return nil, err
		}
		response.Name = student.ThName
		response.Email = student.Email
		response.Faculty = student.Faculty

	} else {
		var instructor InstructorData
		if err := json.Unmarshal(root.Data, &instructor); err != nil {
			return nil, err
		}
		response.Name = instructor.FirstNameTh + " " + instructor.LastNameTh
		response.Email = instructor.Email
		response.Faculty = instructor.Faculty
	}

	return &response, nil
}