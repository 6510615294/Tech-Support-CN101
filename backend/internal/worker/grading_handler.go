package worker

import (
	"context"
	"encoding/json"

	"github.com/hibiken/asynq"

	"github.com/6510615294/Tech-Support-CN101/backend/internal/queue"
	"github.com/6510615294/Tech-Support-CN101/backend/internal/service"
)

func HandleAutoGrading(ctx context.Context, t *asynq.Task) error {
	var payload queue.AutoGradingPayload

	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return err
	}

	print("test")
	return service.RunAutoGrading(payload.AssignmentID, payload.TeacherID)
}
