package errors

type AppError struct {
	Code    int
	Message string
}

func (e *AppError) Error() string {
	return e.Message
}

var (
	ErrUserNotFound 			= &AppError{404, "user not found"}
	ErrAttachmentNotFound 		= &AppError{404, "attachment not found"}
	ErrCommentNotFound 			= &AppError{404, "comment not found"}
	ErrSubmissionNotFound 		= &AppError{404, "submission not found"}
	ErrAssignmentNotFound 		= &AppError{404, "assignment not found"}
	ErrCourseNotFound 			= &AppError{404, "course not found"}
	ErrAssignmentNotAvailable   = &AppError{403, "assignment not available"}
	ErrForbidden      			= &AppError{403, "forbidden"}
	ErrUnauthorized   			= &AppError{401, "unauthorized"}
	ErrBadRequest     			= &AppError{400, "bad request"}
	ErrTooManyAttachments     	= &AppError{400, "too many attachment"}
	ErrTUAPI			    	= &AppError{500, "internal server error (TU API)"}
	ErrCodeExecutor			    = &AppError{500, "internal server error (judge0)"}
)