package auth

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/go-resty/resty/v2"
	"gorm.io/gorm"
)

// AuthenticateUser verifies user credentials.
func AuthenticateUser(inputUsername, password string) (*models.User, error) {
	var user models.User
    apiKey := config.GetEnv("TU_API")
    client := resty.New()
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
        SetHeader("Application-Key", apiKey).
		SetBody(map[string]string{"UserName": inputUsername, "PassWord": password}).
		Post("https://restapi.tu.ac.th/api/v1/auth/Ad/verify")

	if err != nil {
		return nil, err
	} else if resp.StatusCode() != 200 {
        return  nil, errors.New("unexpected status code from TU API")
    }

    var data map[string]interface{}
	if err := json.Unmarshal(resp.Body(), &data); err != nil {
		log.Fatal(err)
        return nil, err
	}

    username := toString(data["username"])

	err = database.DB.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Username does NOT exist
        var extra string
        var role models.Role

        if val, ok := data["faculty"].(string); ok {
            extra = val
            role = models.RoleStudent

        } else if val, ok := data["organization"].(string); ok {
            extra = val
            role = models.RoleTeacher
        } else {
            extra = "None"
            role = models.RoleStudent
        }

        return CreateUser(
            username,
            toString(data["displayname_th"]),
            toString(data["displayname_en"]),
            toString(data["email"]),
            toString(data["department"]),
            extra,
            role,
        )
	} else if err != nil {
		// Some other DB error
		return nil, err
	}

	return &user, nil
}

func CreateUser(username, thaiName, engName, email, department, extra string, role models.Role) (*models.User, error) {
	user := &models.User{
		Username:   username,
		ThaiName:   thaiName,
		EngName:    engName,
		Email:      email,
		Department: department,
		Extra:      extra,
		Role:       role,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// Insert into database
	if err := database.DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func toString(v interface{}) string {
	if str, ok := v.(string); ok {
		return str
	}
	return ""
}