package ai

type Credential struct {
	Provider string
	APIKey   string
	BaseURL  string // optional
}

type ChatRequest struct {
	Model       string
	Messages    []Message
	Temperature float32
}

type Message struct {
	Role    string // "user", "assistant", "system"
	Content string
}

type ChatResponse struct {
	Content string
	Model   string
}

type Model struct {
	ID   string
	Name string
}