package service

import (
	"mime/multipart"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
)

func CreateAssignmentTemplate(
	userID string,
	form *models.AssignmentTemplateForm,
	files []*multipart.FileHeader,
) (*models.ResponseAssignmentTemplate, error) {
	if len(form.Attachments)+len(files) > 5 {
		return nil, errors.ErrTooManyAttachments
	}

	attachments, err := handleAttachments(userID, form.Attachments, files)
	if err != nil {
		return nil, err
	}

	tags, err := resolveTags(form.Tags)
	if err != nil {
		return nil, err
	}

	template := models.AssignmentTemplate{
		Title:       		form.Title,
		Description: 		form.Description,
		Point:       		form.Point,
		Attachments: 		attachments,
		Tags:        		tags,
		AIConfigID: 		form.AIConfigID,
		Prompt:     		form.Prompt,
		CreatedBy:   		userID,
	}
	
	_, err = repository.CreateAssignmentTemplate(&template);
	if err != nil {
		return nil, err
	}
	
	response := models.ConvertAssignmentTemplateToResponse(&template)

	return response, nil
}

func GetAssignmentTemplates(userID string) (*[]models.ResponseAssignmentTemplates, error) {
	var templates []models.AssignmentTemplate

	templates, err := repository.GetAssignmentTemplates(userID)
	if err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentTemplatesToResponse(templates)

	return &response, nil
}

func GetShortAssignmentTemplates(userID string) (*[]models.ResponseShortAssignmentTemplates, error) {
	var templates []models.AssignmentTemplate

	templates, err := repository.GetAssignmentTemplates(userID)
	if err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentTemplatesToShortResponse(templates)

	return &response, nil
}

func GetAssignmentTemplate(userID, templateID string) (*models.ResponseAssignmentTemplate, error) {
	template, err := repository.GetAssignmentTemplate(userID, templateID)
	if err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentTemplateToResponse(template)

	return response, nil
}

func UpdateAssignmentTemplate(
	templateID,
	userID string,
	form *models.AssignmentTemplateForm,
	files []*multipart.FileHeader,
) (*models.ResponseAssignmentTemplate, error) {

	template, err := repository.GetAssignmentTemplate(userID, templateID)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{}

	if form.Title != "" {
		updates["title"] = form.Title
	}

	if form.Point > 0 {
		updates["point"] = form.Point
	}
	
	updates["description"] = form.Description

	if form.AIConfigID != nil {
		updates["ai_config_id"] = form.AIConfigID
	}
	
	if form.Prompt != nil {
		updates["prompt"] = form.Prompt
	}
	
	if len(updates) > 0 {
		if err := repository.UpdateAssignmentTemplate(templateID, updates); err != nil {
			return nil, err
		}
	}
	attachments, err := handleAttachments(
		userID,
		form.Attachments,
		files,
	)
	if err != nil {
		return nil, err
	}

	if err := repository.ReplaceAssignmentTemplateAttachments(
		templateID,
		attachments,
	); err != nil {
		return nil, err
	}

	tags, err := resolveTags(form.Tags)
	if err != nil {
		return nil, err
	}

	if err := repository.ReplaceAssignmentTemplateTags(templateID, tags); err != nil {
		return nil, err
	}

	template, err = repository.GetAssignmentTemplate(userID, templateID)
	if err != nil {
		return nil, err
	}

	response := models.ConvertAssignmentTemplateToResponse(template)

	return response, nil
}

func DeleteAssignmentTemplate(userID, templateID string) error {

	template, err := repository.GetAssignmentTemplate(userID, templateID)
	if err != nil {
		return err
	}

	if err := repository.DeleteAssignmentTemplate(template); err != nil {
		return err
	}

	return nil
}
