package ai

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

type AnthropicProvider struct{}

func NewAnthropicProvider() *AnthropicProvider {
	return &AnthropicProvider{}
}

func (p *AnthropicProvider) createClient(cred Credential) anthropic.Client {
	return anthropic.NewClient(
		option.WithAPIKey(cred.APIKey),
	)
}

func (p *AnthropicProvider) ListModels(ctx context.Context, cred Credential) ([]Model, error) {
	client := p.createClient(cred)
	
	modelsPage, err := client.Models.List(ctx, anthropic.ModelListParams{})
	if err != nil {
		return nil, fmt.Errorf("failed to list models: %w", err)
	}

	result := make([]Model, 0, len(modelsPage.Data))
	for _, model := range modelsPage.Data {
		result = append(result, Model{
			ID:   model.ID,
			Name: model.DisplayName,
		})
	}

	return result, nil
}

func (p *AnthropicProvider) Chat(ctx context.Context, cred Credential, req ChatRequest) (ChatResponse, error) {
	client := p.createClient(cred)

	var systemMsg string
	messages := make([]anthropic.MessageParam, 0, len(req.Messages))
	for _, msg := range req.Messages {
		switch msg.Role {
		case "system":
			systemMsg = msg.Content
		case "user":
			messages = append(messages, anthropic.NewUserMessage(anthropic.NewTextBlock(msg.Content)))
		case "assistant":
			messages = append(messages, anthropic.NewAssistantMessage(anthropic.NewTextBlock(msg.Content)))
		}
	}

	messageReq := anthropic.MessageNewParams{
		Model:     anthropic.Model(req.Model),
		MaxTokens: 4096,
		Messages:  messages,
	}

	if systemMsg != "" {
	    messageReq.System = []anthropic.TextBlockParam{
	        {Text: systemMsg, Type: "text"},
	    }
	}

	if req.Temperature > 0 {
		messageReq.Temperature = anthropic.Float(float64(req.Temperature))
	}

	message, err := client.Messages.New(ctx, messageReq)
	if err != nil {
		return ChatResponse{}, fmt.Errorf("failed to create message: %w", err)
	}

	if len(message.Content) == 0 {
		return ChatResponse{}, fmt.Errorf("no content returned from API")
	}

	var content string
	for _, block := range message.Content {
		if block.Type == "text" {
			content = block.Text
			break
		}
	}

	if content == "" {
		return ChatResponse{}, fmt.Errorf("no text content returned from API")
	}

	return ChatResponse{
		Content: content,
		Model:   string(message.Model),
	}, nil
}