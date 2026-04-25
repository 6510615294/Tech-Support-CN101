package service

import (
	"context"
	"fmt"
	stderrors "errors"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/ai"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/security"
)

func getEncryptionKey() ([]byte, error) {
	key := config.GetEnv("AI_SECRET_KEY")

	if len(key) == 0 {
		return nil, fmt.Errorf("AI_SECRET_KEY not set")
	}

	return []byte(key), nil
}

func CreateAIConfig(userID string, form *models.AIConfigForm) (*models.ResponseAIConfig, error) {
	// Check if config already exists for this user
	_, err := repository.GetAIConfig(userID)
	if err == nil {
		return nil, errors.ErrAIConfigAlreadyExists
	}
	if !stderrors.Is(err, errors.ErrAIConfigNotFound) {
		return nil, err
	}

	key, err := getEncryptionKey()
	if err != nil {
		return nil, err
	}

	encryptedKey, err := security.Encrypt(form.APIKey, key)
	if err != nil {
		return nil, err
	}

	config := &models.AIConfig{
		UserID:          userID,
		Provider:        form.Provider,
		EncryptedAPIKey: encryptedKey,
		BaseURL:         form.BaseURL,
		Model:           form.Model,
		Temperature:     form.Temperature,
		PromptTemplate:  form.PromptTemplate,
	}

	err = repository.CreateAIConfig(config)
	if err != nil {
		return nil, err
	}

	response := models.ResponseAIConfig{
		Provider:       form.Provider,
		BaseURL:        form.BaseURL,
		Model:          form.Model,
		Temperature:    form.Temperature,
		PromptTemplate: form.PromptTemplate,
	}

	return &response, nil
}

func GetAIConfig(userID string) (*models.ResponseAIConfig, error) {
	config, err := repository.GetAIConfig(userID)
	if err != nil {
		return nil, err
	}

	response := models.ResponseAIConfig{
		Provider:       config.Provider,
		BaseURL:        config.BaseURL,
		Model:          config.Model,
		Temperature:    config.Temperature,
		PromptTemplate: config.PromptTemplate,
	}

	return &response, nil
}

func UpdateAIConfig(
	userID string,
	form *models.AIConfigForm,
) (*models.ResponseAIConfig, error) {
	config, err := repository.GetAIConfig(userID)
	if err != nil {
		return nil, err
	}

	updates := map[string]any{}

	if form.Provider != "" {
		updates["provider"] = form.Provider
	}

	if form.Model != "" {
		updates["model"] = form.Model
	}

	if form.APIKey != "" {
		key, err := getEncryptionKey()
		if err != nil {
			return nil, err
		}

		encryptedKey, err := security.Encrypt(form.APIKey, key)
		if err != nil {
			return nil, err
		}

		updates["encrypted_api_key"] = encryptedKey
	}

	if form.BaseURL != "" {
		updates["base_url"] = form.BaseURL
	}

	if form.PromptTemplate != "" {
		updates["prompt_template"] = form.PromptTemplate
	}

	updates["temperature"] = form.Temperature

	if len(updates) > 0 {
		if err := repository.UpdateAIConfig(userID, updates); err != nil {
			return nil, err
		}

		config, err = repository.GetAIConfigByID(config.ID)
		if err != nil {
			return nil, err
		}
	}

	response := models.ResponseAIConfig{
		Provider:       config.Provider,
		BaseURL:        config.BaseURL,
		Model:          config.Model,
		Temperature:    config.Temperature,
		PromptTemplate: config.PromptTemplate,
	}

	return &response, nil
}

func DeleteAIConfig(userID string) error {
	config, err := repository.GetAIConfig(userID)
	if err != nil {
		return err
	}

	return repository.DeleteAIConfig(config.ID)
}

func GetModels(userID string) ([]models.ResponseModel, error) {
	// Get user's AI config
	config, err := repository.GetAIConfig(userID)
	if err != nil {
		return nil, err
	}

	// Decrypt API key
	key, err := getEncryptionKey()
	if err != nil {
		return nil, err
	}

	apiKey, err := security.Decrypt(config.EncryptedAPIKey, key)
	if err != nil {
		return nil, err
	}

	// Create credential
	credential := ai.Credential{
		Provider: config.Provider,
		APIKey:   apiKey,
		BaseURL:  config.BaseURL,
	}

	
	provider, err := ai.GetProvider(config.Provider)
	if err != nil {
		return nil, err
	}
	
	modelList, err := provider.ListModels(context.Background(), credential)
	if err != nil {
		return nil, err
	}
	
	return models.ConvertAIModelsToResponse(modelList), nil
}