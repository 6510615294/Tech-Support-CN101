package queue

const TypeAutoGrading = "assignment:auto_grading"

type AutoGradingPayload struct {
	AssignmentID string `json:"assignment_id"`
	TeacherID    string `json:"teacher_id"`
}
