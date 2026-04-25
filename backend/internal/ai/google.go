package ai

import (
	"context"
	"fmt"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

type GoogleProvider struct{}

func NewGoogleProvider() *GoogleProvider {
	return &GoogleProvider{}
}

func (p *GoogleProvider) createClient(ctx context.Context, cred Credential) (*genai.Client, error) {
	return genai.NewClient(
		ctx, 
		option.WithAPIKey(cred.APIKey),
	)
}

func (p *GoogleProvider) ListModels(ctx context.Context, cred Credential) ([]Model, error) {
	client, err := p.createClient(ctx, cred)
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	modelsIter := client.ListModels(ctx)

	var result []Model
	for {
		model, err := modelsIter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to list models: %w", err)
		}
		result = append(result, Model{
			ID:   model.Name,
			Name: model.DisplayName,
		})
	}
	return result, nil
}

func (p *GoogleProvider) Chat(ctx context.Context, cred Credential, req ChatRequest) (ChatResponse, error) {
	client, err := p.createClient(ctx, cred)
	if err != nil {
		return ChatResponse{}, fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	model := client.GenerativeModel(req.Model)

	if req.Temperature > 0 {
		model.Temperature = &req.Temperature
	}

	cs := model.StartChat()

	for i, msg := range req.Messages {
		if i == len(req.Messages)-1 {
			break
		}

		var parts []genai.Part
		if msg.Content != "" {
			parts = append(parts, genai.Text(msg.Content))
		}

		switch msg.Role {
		case "user":
			cs.History = append(cs.History, &genai.Content{
				Parts: parts,
				Role:  "user",
			})
		case "assistant":
			cs.History = append(cs.History, &genai.Content{
				Parts: parts,
				Role:  "model",
			})
		}
	}

	lastMsg := req.Messages[len(req.Messages)-1]
	if lastMsg.Role != "user" {
		return ChatResponse{}, fmt.Errorf("last message must be from user")
	}

	var userText string
	for _, msg := range req.Messages {
		if msg.Role == "system" {
			userText = "System: " + msg.Content + "\n\n"
			break
		}
	}
	userText += lastMsg.Content

	resp, err := cs.SendMessage(ctx, genai.Text(userText))
	if err != nil {
		return ChatResponse{}, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 {
		return ChatResponse{}, fmt.Errorf("no candidates returned from API")
	}

	var content string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			content += string(text)
		}
	}

	if content == "" {
		return ChatResponse{}, fmt.Errorf("no text content returned from API")
	}

	return ChatResponse{
		Content: content,
		Model:   req.Model,
	}, nil
}