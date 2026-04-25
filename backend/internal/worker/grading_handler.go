package worker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/ai"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/queue"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/storage"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/repository"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/security"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/logger"
)

func HandleAutoGrading(ctx context.Context, t *asynq.Task) error {
	var payload queue.AutoGradingPayload

	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return err
	}

	return runAutoGrading(payload.AssignmentID, payload.TeacherID)
}

func runAutoGrading(assignmentID string, teacherID string) error {
	log := logger.Log
	
	log.Info("auto_grading_attempt",
		"teacher_id", teacherID,
		"assignment_id", assignmentID,
	)

	submissions, err := repository.GetSubmissions(assignmentID)
	if err != nil {
		log.Error("auto_grading_failed",
			"error", err,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
		)
		return err
	}
	total := len(submissions)

	if total == 0 {
		log.Error("auto_grading_failed",
			"error", errors.ErrSubmissionNotFound,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
		)
		return errors.ErrSubmissionNotFound
	}

	err = repository.GradingJobStart(assignmentID, teacherID, total)
	if err != nil {
		log.Error("auto_grading_failed",
			"error", err,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
		)
		return err
	}

	maxPoint, assignmentPrompt, err := repository.GetAssignmentMaxPointAndPrompt(assignmentID)
	if err != nil {
		log.Error("auto_grading_failed",
			"error", err,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
		)
		return err
	}

	// Get teacher's AI config
	aiConfig, err := repository.GetAIConfig(teacherID)
	if err != nil {
		log.Error("auto_grading_failed",
			"error", err,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
			"reason", "Failed to get AI config",
		)
		repository.FailGradingJob(assignmentID, teacherID, "Failed to get AI config: "+err.Error())
		return err
	}

	// Decrypt API key
	key, err := getEncryptionKey()
	if err != nil {
		log.Error("auto_grading_failed",
			"error", err,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
			"reason", "Failed to get encryption key",
		)
		repository.FailGradingJob(assignmentID, teacherID, "Failed to get encryption key: "+err.Error())
		return err
	}
	apiKey, err := security.Decrypt(aiConfig.EncryptedAPIKey, key)
	if err != nil {
		log.Error("auto_grading_failed",
			"error", err,
			"teacher_id", teacherID,
			"assignment_id", assignmentID,
			"reason", "Failed to decrypt API key",
		)
		repository.FailGradingJob(assignmentID, teacherID, "Failed to decrypt API key: "+err.Error())
		return err
	}

	// Process in batches of 10
	batchSize := 10
	for i := 0; i < len(submissions); i += batchSize {
		end := min(i+batchSize, len(submissions))
    	batch := submissions[i:end]

		// Prepare aiSubmissionForm list
		aiSubmissionForm := make([]models.AISubmissionForm, 0, len(batch))
		for _, submission := range batch {
			answer := ""

			if submission.Attachment != nil {
				fileBytes, err := storage.DownloadFile(submission.Attachment.FileKey)
				if err != nil {
					log.Error("auto_grading_failed",
						"error", err,
						"teacher_id", teacherID,
						"assignment_id", assignmentID,
						"submission_id", submission.ID,
						"reason", "Failed to download attachment",
					)
					return err
				}
				answer = removePythonComments(string(fileBytes))
			}

			aiSubmissionForm = append(aiSubmissionForm, models.AISubmissionForm{
				SubmissionID: submission.ID,
				Answer:       answer,
			})
		}

		// Serialize submissions for the prompt
		submissionsJSON, err := json.Marshal(aiSubmissionForm)
		if err != nil {
			log.Error("auto_grading_failed",
				"error", err,
				"teacher_id", teacherID,
				"assignment_id", assignmentID,
				"reason", "Failed to marshal submissions",
			)
			repository.FailGradingJob(assignmentID, teacherID, "Failed to marshal submissions: "+err.Error())
			return err
		}

		// Prepare AI API request
		prompt := buildGradingPrompt(assignmentPrompt, int(*maxPoint), string(submissionsJSON))
		
		// Get AI provider
		provider, err := ai.GetProvider(aiConfig.Provider)
		if err != nil {
			log.Error("auto_grading_failed",
				"error", err,
				"teacher_id", teacherID,
				"assignment_id", assignmentID,
				"reason", "Failed to get AI provider",
			)
			repository.FailGradingJob(assignmentID, teacherID, "Failed to get AI provider: "+err.Error())
			return err
		}

		// Create credential
		cred := ai.Credential{
			Provider: aiConfig.Provider,
			APIKey:   apiKey,
			BaseURL:  aiConfig.BaseURL,
		}

		// Create chat request
		chatReq := ai.ChatRequest{
			Model:       aiConfig.Model,
			Messages: []ai.Message{
				{
					Role:    "system",
					Content: "You are a strict and fair programming teacher. Always return valid JSON and follow instructions exactly.",
				},
				{
					Role:    "user",
					Content: prompt,
				},
			},
			Temperature: aiConfig.Temperature,
		}

		// Call AI API
		chatResp, err := provider.Chat(context.Background(), cred, chatReq)
		if err != nil {
			log.Error("auto_grading_failed",
				"error", err,
				"teacher_id", teacherID,
				"assignment_id", assignmentID,
				"reason", "Failed to call AI API",
			)
			repository.FailGradingJob(assignmentID, teacherID, "Failed to call AI API: "+err.Error())
			return err
		}

		// Parse AI response as AIGradingForm array
		var aiGradingForms []models.AIGradingForm
		if err := json.Unmarshal([]byte(chatResp.Content), &aiGradingForms); err != nil {
			log.Error("auto_grading_failed",
				"error", err,
				"teacher_id", teacherID,
				"assignment_id", assignmentID,
				"reason", "AI content is not a valid grading list",
			)
			repository.FailGradingJob(assignmentID, teacherID, "AI Content is not a valid Grading List: "+err.Error())
			return err
		}



		for _, gradingForm := range aiGradingForms {
			err = repository.UpdateSubmission(gradingForm.SubmissionID, map[string]any{
				"point":     gradingForm.Point,
				"graded_by": "ai",
			})
			if err != nil {
				log.Error("auto_grading_failed",
					"error", err,
					"teacher_id", teacherID,
					"assignment_id", assignmentID,
					"submission_id", gradingForm.SubmissionID,
					"reason", "Failed to update submission",
				)
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
				log.Error("auto_grading_failed",
					"error", err,
					"teacher_id", teacherID,
					"assignment_id", assignmentID,
					"submission_id", gradingForm.SubmissionID,
					"reason", "Failed to create comment",
				)
				repository.FailGradingJob(assignmentID, teacherID, "Failed to create comment: "+err.Error())
				return err
			}
		}

		progress := int(float64(end) / float64(total) * 100)
		err = repository.UpdateGradingJob(assignmentID, teacherID, progress, end)
		if err != nil {
			log.Error("auto_grading_failed",
				"error", err,
				"teacher_id", teacherID,
				"assignment_id", assignmentID,
				"progress", progress,
				"reason", "Failed to update grading job progress",
			)
			repository.FailGradingJob(assignmentID, teacherID, "Failed to update grading job progress: "+err.Error())
			return err
		}
	}

	repository.CompleteGradingJob(assignmentID, teacherID)

	log.Info("auto_grading_success",
		"teacher_id", teacherID,
		"assignment_id", assignmentID,
		"total_submissions", total,
	)

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

func removePythonComments(code string) string {
	var result []rune
	runes := []rune(code)
	n := len(runes)
	i := 0

	// Quote states
	inSingleQuote := false
	inDoubleQuote := false
	inTripleSingle := false
	inTripleDouble := false

	for i < n {
		// Check for triple single quotes
		if i+2 < n && runes[i] == '\'' && runes[i+1] == '\'' && runes[i+2] == '\'' {
			if inTripleSingle {
				inTripleSingle = false
			} else if !inDoubleQuote && !inTripleDouble {
				inTripleSingle = true
			}
			i += 3
			continue
		}

		// Check for triple double quotes
		if i+2 < n && runes[i] == '"' && runes[i+1] == '"' && runes[i+2] == '"' {
			if inTripleDouble {
				inTripleDouble = false
			} else if !inSingleQuote && !inTripleSingle {
				inTripleDouble = true
			}
			i += 3
			continue
		}

		// If we're inside triple quotes, skip content (don't add to result)
		if inTripleSingle || inTripleDouble {
			i++
			continue
		}

		// Check for # comments (but not inside strings)
		if runes[i] == '#' && !inSingleQuote && !inDoubleQuote {
			// Skip to end of line
			for i < n && runes[i] != '\n' {
				i++
			}
			continue
		}

		// Track regular quotes
		if runes[i] == '\'' && !inDoubleQuote {
			inSingleQuote = !inSingleQuote
		}
		if runes[i] == '"' && !inSingleQuote {
			inDoubleQuote = !inDoubleQuote
		}

		// Add character to result
		result = append(result, runes[i])
		i++
	}

	return string(result)
}

func getEncryptionKey() ([]byte, error) {
	key := config.GetEnv("AI_SECRET_KEY")

	if len(key) == 0 {
		return nil, fmt.Errorf("AI_SECRET_KEY not set")
	}

	return []byte(key), nil
}