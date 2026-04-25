package ai

import (
	"context"
	"fmt"	
)

type AIProvider interface {
	ListModels(ctx context.Context, cred Credential) ([]Model, error)
	Chat(ctx context.Context, cred Credential, req ChatRequest) (ChatResponse, error)
}

func GetProvider(provider string) (AIProvider, error) {
	switch provider {
	case "openai":
		return NewOpenAIProvider(), nil

	case "anthropic":
		return NewAnthropicProvider(), nil

	case "google":
		return NewGoogleProvider(), nil

	case "custom":
		return NewOpenAIProvider(), nil

	default:
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}
}