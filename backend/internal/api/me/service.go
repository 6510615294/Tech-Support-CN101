package me

import (
	"encoding/json"
	"log"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/go-resty/resty/v2"
)

func GetUserData(userID string) (map[string]interface{}, error) {
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

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		log.Fatal("Error decoding JSON:", err)
		return nil, err
	}

	data, ok := result["data"].(map[string]interface{})
	if !ok {
		log.Fatal("Invalid or missing 'data' field")
		return nil, err
	}

	data["userRole"] = user.Role

	return data, nil
}