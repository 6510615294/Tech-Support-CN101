package service

import (
	stderrors "errors"
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
	"github.com/go-resty/resty/v2"
)

type TUAPIResponse struct {
	Status   bool   `json:"status"`
	Message  string `json:"message"`
	Username string `json:"username"`
	ThName   string `json:"displayname_th"`
	EnName   string `json:"displayname_en"`
	Type     string `json:"type"`
	Email    string `json:"email"`
}

func AuthenticateUser(form *models.LoginForm) (*models.User, error) {

	apiKey := config.GetEnv("TU_API")

	client := resty.New()
	var res TUAPIResponse

	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("Application-Key", apiKey).
		SetBody(map[string]string{
			"UserName": form.Username,
			"PassWord": form.Password,
		}).
		SetResult(&res).
		Post("https://restapi.tu.ac.th/api/v1/auth/Ad/verify")

	if err != nil {
		return nil, errors.ErrTUAPI
	}

	if resp.StatusCode() != 200 {
		tuMsg := res.Message
		if tuMsg == "" {
			tuMsg = string(resp.Body())
		}

		isInvalidCred := resp.StatusCode() == 400 &&
			(!res.Status || tuMsg == "User or Password Invalid!" || tuMsg == "The request body has error! (UserName or PassWord Invalid!)")

		if isInvalidCred {
			return nil, errors.ErrInvalidCredentials
		}

		return nil, errors.ErrTUAPI
	}

	user, err := repository.GetUserByUsername(res.Username)

	if stderrors.Is(err, errors.ErrUserNotFound) {

		var role models.Role
		if res.Type == "student" {
			role = models.RoleStudent
		} else {
			role = models.RoleTeacher
		}

		newUser := &models.User{
			Username:  res.Username,
			UserType:  res.Type,
			ThName:    res.ThName,
			EnName:    res.EnName,
			Role:      role,
			Email:     res.Email,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		return repository.CreateUser(newUser)
	}

	if err != nil {
		return nil, err
	}

	if user.ThName != res.ThName || user.EnName != res.EnName {

		user.ThName = res.ThName
		user.EnName = res.EnName
		user.UpdatedAt = time.Now()

		if err := repository.UpdateUser(user); err != nil {
			return nil, err
		}
	}

	return user, nil
}
