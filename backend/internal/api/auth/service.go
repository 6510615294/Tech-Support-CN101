package auth

import (
	"errors"
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/go-resty/resty/v2"
	"gorm.io/gorm"
)

type TUAPIResponse struct {
	Status		bool	`json:"status"`
	Username	string	`json:"username"`
	ThName		string	`json:"displayname_th"`
	EnName		string	`json:"displayname_en"`
	Type 		string	`json:"type"`
	Email		string	`json:"email"`
}

// AuthenticateUser verifies user credentials.
func AuthenticateUser(inputUsername, password string) (*models.User, error) {
	var user models.User
    apiKey := config.GetEnv("TU_API")
    client := resty.New()
	var res TUAPIResponse
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Application-Key", apiKey).
		SetBody(map[string]string{
			"UserName": inputUsername,
			"PassWord": password,
		}).
		SetResult(&res).
		Post("https://restapi.tu.ac.th/api/v1/auth/Ad/verify")

	if err != nil {
		return nil, err
	} else if resp.StatusCode() != 200 {
        return  nil, errors.New("unexpected status code from TU API")
    }

	err = database.DB.Where("username = ?", res.Username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Username does NOT exist
		var role models.Role
		if res.Type == "student" {
			role = models.RoleStudent
		} else {
			role = models.RoleTeacher
		}

		user := &models.User{
			Username: 	res.Username,
			UserType: 	res.Type,
			ThName: 	res.ThName,
			EnName: 	res.EnName,
			Role: 		role,
			Email: 		res.Email,
			CreatedAt: 	time.Now(),
			UpdatedAt: 	time.Now(),
		}

		if err := database.DB.Create(user).Error; err != nil {
			return nil, err
		}

        return user, nil
	} else if err != nil {
		// Some other DB error
		return nil, err
	} else if user.ThName != res.ThName || user.EnName != res.EnName {

		err := database.DB.Model(&user).Updates(map[string]interface{}{
			"th_name":    res.ThName,
			"en_name":    res.EnName,
			"updated_at": time.Now(),
		}).Error

		if err != nil {
			return nil, err
		}
	}	

	return &user, nil
}