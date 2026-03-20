package service

import (
	"encoding/json"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
	"github.com/go-resty/resty/v2"
)

func GetUserData(userID string) (*models.ResponseUserData, error) {
	user, err := repository.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	data, err := GetTUProfile(user)
	if err != nil {
		return nil, err
	}

	var response models.ResponseUserData
	response.Username = user.Username
	response.Role = string(user.Role)

	if user.UserType == "student" {
		var student struct {
			Name    string `json:"displayname_th"`
			Email   string `json:"email"`
			Faculty string `json:"faculty"`
		}

		if err := json.Unmarshal(data, &student); err != nil {
			return nil, err
		}

		response.Name = student.Name
		response.Email = student.Email
		response.Faculty = student.Faculty

	} else {
		var instructor struct {
			FirstName string `json:"First_Name_Th"`
			LastName  string `json:"Last_Name_Th"`
			Email     string `json:"Email"`
			Faculty   string `json:"Faculty_Name_Th"`
		}

		if err := json.Unmarshal(data, &instructor); err != nil {
			return nil, err
		}

		response.Name = instructor.FirstName + " " + instructor.LastName
		response.Email = instructor.Email
		response.Faculty = instructor.Faculty
	}

	return &response, nil
}

func GetTUProfile(user *models.User) (json.RawMessage, error) {

	studentURL := "https://restapi.tu.ac.th/api/v2/profile/std/info/?id="
	teacherURL := "https://restapi.tu.ac.th/api/v2/profile/Instructors/info/?Email="

	var url string
	if user.UserType == "student" {
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
		return nil, err
	}

	var root struct {
		Data json.RawMessage `json:"data"`
	}

	if err := json.Unmarshal(resp.Body(), &root); err != nil {
		return nil, err
	}

	return root.Data, nil
}
