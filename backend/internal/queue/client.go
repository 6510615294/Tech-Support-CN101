package queue

import (
	// "crypto/tls"
	"encoding/json"

	"github.com/hibiken/asynq"
)

var Client *asynq.Client

func Init(redisAddr, redisPassword string) {
	Client = asynq.NewClient(asynq.RedisClientOpt{
		Addr:     redisAddr,
		Password: redisPassword,
		// TLSConfig: &tls.Config{
		// 	MinVersion: tls.VersionTLS12,
		// },
	})
}

func EnqueueAutoGrading(payload AutoGradingPayload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeAutoGrading, data)

	_, err = Client.Enqueue(task,
		asynq.MaxRetry(3),
		asynq.Timeout(60),
	)

	return err
}
