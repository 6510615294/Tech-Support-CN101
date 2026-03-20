package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	GradingJobsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "grading_jobs_total",
			Help: "Total grading jobs",
		},
		[]string{"status"},
	)

	GradingDuration = prometheus.NewHistogram(
		prometheus.HistogramOpts{
			Name: "grading_duration_seconds",
			Help: "Time spent grading",
		},
	)

	AIRequestTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "ai_requests_total",
			Help: "AI API calls",
		},
		[]string{"provider", "status"},
	)
)
