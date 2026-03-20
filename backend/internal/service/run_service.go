package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/config"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/errors"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/models"
)

type judgeRequest struct {
	SourceCode    string  `json:"source_code"`
	LanguageID    int     `json:"language_id"`
	Stdin         string  `json:"stdin,omitempty"`
	CpuTimeLimit  float64 `json:"cpu_time_limit,omitempty"`
	WallTimeLimit float64 `json:"wall_time_limit,omitempty"`
	MemoryLimit   int     `json:"memory_limit,omitempty"`
	StackLimit    int     `json:"stack_limit,omitempty"`
	MaxProcesses  int     `json:"max_processes_and_or_threads,omitempty"`
	EnableNetwork bool    `json:"enable_network,omitempty"`
}

type judgeResponse struct {
	Stdout        string  `json:"stdout"`
	Time          string  `json:"time"`
	Memory        int     `json:"memory"`
	Stderr        *string `json:"stderr"`
	Token         string  `json:"token"`
	CompileOutput *string `json:"compile_output"`
	Message       *string `json:"message"`
	Status        struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	} `json:"status"`
}

func RunPython(form models.PythonCodeForm) (*models.ResponsePythonCode, error) {
	judgeURL := config.GetEnv("JUDGE0_URL")
	apiKey := config.GetEnv("JUDGE0_API_KEY")

	if judgeURL == "" || apiKey == "" {
		return nil, fmt.Errorf("judge0 config missing")
	}

	payload := judgeRequest{
		SourceCode:    form.SourceCode,
		LanguageID:    71,
		Stdin:         form.Input,
		CpuTimeLimit:  2.0,
		WallTimeLimit: 5.0,
		MemoryLimit:   128000,
		StackLimit:    64000,
		MaxProcesses:  100,
		EnableNetwork: false,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/submissions?base64_encoded=false&wait=true", judgeURL)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", apiKey)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, errors.ErrCodeExecutor
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("judge0 returned status %d", resp.StatusCode)
	}

	var judgeResp judgeResponse
	if err := json.NewDecoder(resp.Body).Decode(&judgeResp); err != nil {
		return nil, err
	}

	response := models.ResponsePythonCode{
		Stdout: judgeResp.Stdout,
		Stderr: judgeResp.Stderr,
		Status: judgeResp.Status.Description,
		Time:   judgeResp.Time,
		Memory: int(judgeResp.Memory),
	}

	return &response, nil
}
