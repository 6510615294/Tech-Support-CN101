package ai

import (
	"context"
	"fmt"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
)

type OpenAIProvider struct {}

func NewOpenAIProvider() *OpenAIProvider {
	return &OpenAIProvider{}
}

func (p *OpenAIProvider) createClient(cred Credential) openai.Client {
	if cred.BaseURL != "" && cred.Provider != "openai"{
		return openai.NewClient(
			option.WithAPIKey(cred.APIKey),
			option.WithBaseURL(cred.BaseURL),
		)
	}
	return openai.NewClient(
		option.WithAPIKey(cred.APIKey),
	)
}

func (p *OpenAIProvider) ListModels(ctx context.Context, cred Credential) ([]Model, error) {
	client := p.createClient(cred)
	
	models, err := client.Models.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list models: %w", err)
	}

	result := make([]Model, 0, len(models.Data))
	for _, model := range models.Data {
		result = append(result, Model{
			ID:   model.ID,
			Name: model.ID,
		})
	}

	return result, nil
}

func (p *OpenAIProvider) Chat(ctx context.Context, cred Credential, req ChatRequest) (ChatResponse, error) {
	client := p.createClient(cred)

	// Convert messages to OpenAI format
	messages := make([]openai.ChatCompletionMessageParamUnion, 0, len(req.Messages))
	for _, msg := range req.Messages {
		switch msg.Role {
		case "system":
			messages = append(messages, openai.SystemMessage(msg.Content))
		case "user":
			messages = append(messages, openai.UserMessage(msg.Content))
		case "assistant":
			messages = append(messages, openai.AssistantMessage(msg.Content))
		}
	}

	// Create chat completion request
	chatReq := openai.ChatCompletionNewParams{
		Messages: messages,
		Model:    req.Model,
	}

	if req.Temperature > 0 {
		chatReq.Temperature = openai.Float(float64(req.Temperature))
	}

	// Call the API
	completion, err := client.Chat.Completions.New(ctx, chatReq)
	if err != nil {
		return ChatResponse{}, fmt.Errorf("failed to create chat completion: %w", err)
	}

	if len(completion.Choices) == 0 {
		return ChatResponse{}, fmt.Errorf("no choices returned from API")
	}

	return ChatResponse{
		Content: completion.Choices[0].Message.Content,
		Model:   completion.Model,
	}, nil
}