package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/database"
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

func RunAutoGrading(assignmentID string, teacherID string) error {

	submissions, err := repository.GetSubmissions(assignmentID)
	if err != nil {
		return err
	}
	total := len(submissions)

	err = repository.GradingJobStart(assignmentID, teacherID, total)
	if err != nil {
		return err
	}

	maxPoint, assignmentPrompt, err := repository.GetAssignmentMaxPointAndPrompt(assignmentID)
	if err != nil {
		return err
	}

	// Get teacher's AI config
	aiConfig, err := repository.GetAIConfig(teacherID)
	if err != nil {
		repository.FailGradingJob(assignmentID, teacherID, "Failed to get AI config: "+err.Error())
		return err
	}

	// Decrypt API key
	key, err := getEncryptionKey()
	if err != nil {
		repository.FailGradingJob(assignmentID, teacherID, "Failed to get encryption key: "+err.Error())
		return err
	}
	apiKey, err := security.Decrypt(aiConfig.EncryptedAPIKey, key)
	if err != nil {
		repository.FailGradingJob(assignmentID, teacherID, "Failed to decrypt API key: "+err.Error())
		return err
	}

	// Process in batches of 10
	batchSize := 10
	for i := 0; i < len(submissions); i += batchSize {
		end := i + batchSize
		if end > len(submissions) {
			end = len(submissions)
		}
		batch := submissions[i:end]

		// Prepare N8NSubmission list
		n8nSubmissions := make([]models.AISubmissionForm, 0, len(batch))
		for _, submission := range batch {
			answer := submission.Answer

			if submission.Attachment != nil {
				fileBytes, err := database.DownloadFileFromS3ByKey(submission.Attachment.FileKey)
				if err != nil {
					return err
				}
				answer = string(fileBytes)
			}

			n8nSubmissions = append(n8nSubmissions, models.AISubmissionForm{
				SubmissionID: submission.ID,
				Answer:       answer,
			})
		}

		// Serialize submissions for the prompt
		submissionsJSON, err := json.Marshal(n8nSubmissions)
		if err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to marshal submissions: "+err.Error())
			return err
		}

		// Prepare AI API request
		prompt := buildGradingPrompt(assignmentPrompt, int(*maxPoint), string(submissionsJSON))
		requestBody := map[string]any{
			"model": aiConfig.Model,
			"messages": []map[string]string{
				{
					"role":    "system",
					"content": "You are a strict and fair programming teacher. Always return valid JSON and follow instructions exactly.",
				},
				{
					"role":    "user",
					"content": prompt,
				},
			},
			"temperature": aiConfig.Temperature,
			"stream":      false,
			"thinking": map[string]string{
				"type": "disabled",
			},
			"response_format": map[string]string{
				"type": "json_object",
			},
		}

		requestJSON, err := json.Marshal(requestBody)
		if err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to marshal request body: "+err.Error())
			return err
		}

		// Create HTTP request
		// baseURL := strings.TrimSuffix(aiConfig.BaseURL, "/")
		fullURL := aiConfig.BaseURL + "/chat/completions"
		req, err := http.NewRequest("POST", fullURL, bytes.NewBuffer(requestJSON))
		if err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to create HTTP request: "+err.Error())
			return err
		}

		// Set headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

		// Execute request
		client := &http.Client{
			Timeout: 60 * time.Second,
		}
		resp, err := client.Do(req)
		if err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to call AI API: "+err.Error())
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			errMsg := fmt.Sprintf("AI API returned status %d: %s", resp.StatusCode, string(body))
			repository.FailGradingJob(assignmentID, teacherID, errMsg)
			return fmt.Errorf("%s", errMsg)
		}

		// Parse response
		responseBody, err := io.ReadAll(resp.Body)
		if err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to read response body: "+err.Error())
			return err
		}

		// Parse AI response as AIGradingForm array
		var aiResp models.AIResponse
		if err := json.Unmarshal(responseBody, &aiResp); err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to parse API response: "+err.Error())
			return err
		}

		if len(aiResp.Choices) == 0 {
			return errors.ErrAIError
		}

		var aiGradingForms []models.AIGradingForm
		content := aiResp.Choices[0].Message.Content

		if err := json.Unmarshal([]byte(content), &aiGradingForms); err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "AI Content is not a valid Grading List: "+err.Error())
			return err
		}

		for _, gradingForm := range aiGradingForms {
			err = repository.UpdateSubmission(gradingForm.SubmissionID, map[string]any{
				"point":     gradingForm.Point,
				"graded_by": "ai",
			})
			if err != nil {
				repository.FailGradingJob(assignmentID, teacherID, "Failed to update submission: "+err.Error())
				return err
			}

			// Create AI comment for the submission
			comment := &models.Comment{
				SubmissionID:  gradingForm.SubmissionID,
				Comment:       gradingForm.Comment,
				CreatedByRole: models.RoleAI,
				CreatedBy:     teacherID,
				Visible:       true,
			}
			err = repository.CreateOrUpdateComment(comment)
			if err != nil {
				repository.FailGradingJob(assignmentID, teacherID, "Failed to create comment: "+err.Error())
				return err
			}
		}

		progress := int(float64(end) / float64(total) * 100)
		err = repository.UpdateGradingJob(assignmentID, teacherID, progress, end)
		if err != nil {
			repository.FailGradingJob(assignmentID, teacherID, "Failed to update grading job progress: "+err.Error())
			return err
		}
	}

	repository.CompleteGradingJob(assignmentID, teacherID)

	return nil
}

func buildGradingPrompt(instruction string, maxPoint int, submissionsText string) string {
	return fmt.Sprintf(`
You are a strict and fair programming teacher.

You MUST follow these rules:

1. Grade each submission independently.
2. Point must be an integer between 0 and %d.
3. Do NOT give full point unless the answer is completely correct.
4. If the answer is partially correct, give partial point.
5. If the answer is incorrect, give low point (or 0).
6. Comments must be concise, clear, and helpful.
7. DO NOT hallucinate missing information.
8. DO NOT skip any submission.

---

INSTRUCTION:
%s

MAX_POINT:
%d

---

OUTPUT FORMAT (STRICT):

Return ONLY a valid JSON array.  
Do NOT include explanations, markdown, or extra text.

Each item MUST follow this schema:

{
  "id": "string",
  "point": number,
  "comment": "string"
}

IMPORTANT:
- Output MUST be valid JSON.
- Do NOT include trailing commas.
- Do NOT wrap JSON in markdown.

---

SUBMISSIONS:
%s
`, maxPoint, instruction, maxPoint, submissionsText)
}
