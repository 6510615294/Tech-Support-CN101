package service

import (
	"errors"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

func GetMember(courseID string) ([]models.ResponseMember, error) {
	members, err := repository.GetCourseMembers(courseID)
	if err != nil {
		return nil, err
	}

	results := make([]models.ResponseMember, 0, len(members))

	for _, member := range members {
		results = append(results, models.ResponseMember{
			UserID:   member.UserID,
			Username: member.User.Username,
			EnName:   member.User.EnName,
			ThName:   member.User.ThName,
			Email:    member.User.Email,
			Status:   member.Status,
			Role:     member.Role,
		})
	}

	return results, nil
}

func UpdateMember(courseID, memberID string, form *models.UpdateMemberForm) (*models.ResponseMember, error) {
	updates := make(map[string]any)

	if form.NewRole != "" {
		validRoles := map[string]bool{
			string(models.RoleTeacher):           true,
			string(models.RoleTeacherAssistance): true,
			string(models.RoleStudent):           true,
		}

		if !validRoles[form.NewRole] {
			return nil, errors.New("invalid role")
		}

		updates["role"] = form.NewRole
	}

	if form.NewStatus != "" {
		validStatuses := map[string]bool{
			string(models.StatusActive):   true,
			string(models.StatusInactive): true,
			string(models.StatusWithdraw): true,
			string(models.StatusDrop):     true,
		}

		if !validStatuses[form.NewStatus] {
			return nil, errors.New("invalid status")
		}

		updates["status"] = form.NewStatus
	}

	member, err := repository.UpdateCourseMember(courseID, memberID, updates)
	if err != nil {
		return nil, err
	}

	response := models.ConvertCourseMemberToResponse(member)

	return &response, nil
}

func DeleteMember(courseID, memberID string) error {
	return repository.DeleteCourseMember(courseID, memberID)
}