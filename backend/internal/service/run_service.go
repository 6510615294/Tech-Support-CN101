package service

import (
	"bytes"
	"encoding/base64"
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

	encodedSource := base64.StdEncoding.EncodeToString([]byte(form.SourceCode))
	encodedInput := base64.StdEncoding.EncodeToString([]byte(form.Input))

	payload := judgeRequest{
		SourceCode:    encodedSource,
		LanguageID:    71,
		Stdin:         encodedInput,
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

	url := fmt.Sprintf("%s/submissions?base64_encoded=true&wait=true", judgeURL)

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

	fmt.Printf("%+v\n", judgeResp)

	// Decode base64 response fields from Judge0
	stdout, err := base64.StdEncoding.DecodeString(judgeResp.Stdout)
	if err != nil {
		return nil, fmt.Errorf("failed to decode stdout: %w", err)
	}

	var stderrStr *string
	if judgeResp.Stderr != nil && *judgeResp.Stderr != "" {
		decoded, err := base64.StdEncoding.DecodeString(*judgeResp.Stderr)
		if err != nil {
			return nil, fmt.Errorf("failed to decode stderr: %w", err)
		}
		s := string(decoded)
		stderrStr = &s
	}

	var compileOutput *string
	if judgeResp.CompileOutput != nil && *judgeResp.CompileOutput != "" {
		decoded, err := base64.StdEncoding.DecodeString(*judgeResp.CompileOutput)
		if err != nil {
			return nil, fmt.Errorf("failed to decode compile_output: %w", err)
		}
		s := string(decoded)
		compileOutput = &s
	}

	response := models.ResponsePythonCode{
		Stdout: string(stdout),
		Stderr: stderrStr,
		Status: judgeResp.Status.Description,
		Time:   judgeResp.Time,
		Memory: int(judgeResp.Memory),
	}

	_ = compileOutput // available if needed

	return &response, nil
}
