package models

func ConvertCourseToResponse(course Course) ResponseCourse {
	return ResponseCourse{
		ID:         course.ID,
		Name:       course.Name,
		Schedule:  	course.CourseDate,
		Section:    course.Section,
		Semester:	course.Semester,
		Teacher:   	course.Teacher.Username,
	}
}

func ConvertCoursesToResponse(courses []Course) []ResponseCourse {
	response := make([]ResponseCourse, 0, len(courses))
	for _, c := range courses {
		response = append(response, ConvertCourseToResponse(c))
	}
	return response
}

func ConvertEnrollmentToResponse(enrollment Enrollment) ResponseEnrollment {
	return ResponseEnrollment{
		ID:         enrollment.ID,
		Status: 	enrollment.Status,
		CourseID:	enrollment.CourseID,
		StudentID: 	enrollment.StudentID,
	}
}

func ConvertEnrollmentsToResponse(enrollments []Enrollment) []ResponseEnrollment {
	response := make([]ResponseEnrollment, 0, len(enrollments))
	for _, c := range enrollments {
		response = append(response, ConvertEnrollmentToResponse(c))
	}
	return response
}

func ConvertAssignmentToResponse(a Assignment) ResponseAssignment {
	tagNames := make([]string, len(a.Tags))
	for i, tag := range a.Tags {
		tagNames[i] = tag.Name
	}

	const layout = "2006-01-02"

	var fileName *string
	if a.Attachment != nil {
		fileName = &a.Attachment.FileName
	}

	return ResponseAssignment{
		ID:           a.ID,
		Title:        a.Title,
		Description:  a.Description,
		Point:        a.Point,
		StartDate:    a.StartDate.Format(layout),
		DueDate:      a.DueDate.Format(layout),
		CloseDate:    a.CloseDate.Format(layout),
		AttachmentID: a.AttachmentID,
		FileName:     fileName,
		Tags:         tagNames,
	}
}


func ConvertAssignmentsToResponse(assignments []Assignment) []ResponseAssignment {
	response := make([]ResponseAssignment, 0, len(assignments))
	for _, a := range assignments {
		response = append(response, ConvertAssignmentToResponse(a))
	}
	return response
}

func ConvertDetailedAssignmentToResponse(
	a Assignment,
	s *[]Submission,
) ResponseDetailedAssignment {

	tagNames := make([]string, len(a.Tags))
	for i, tag := range a.Tags {
		tagNames[i] = tag.Name
	}

	const layout = "2006-01-02"

	var assignmentFileName *string
	if a.Attachment != nil {
		assignmentFileName = &a.Attachment.FileName
	}

	assignmentResponse := ResponseAssignment{
		ID:           a.ID,
		Title:        a.Title,
		Description:  a.Description,
		Point:        a.Point,
		StartDate:    a.StartDate.Format(layout),
		DueDate:      a.DueDate.Format(layout),
		CloseDate:    a.CloseDate.Format(layout),
		AttachmentID: a.AttachmentID,
		FileName:     assignmentFileName,
		Tags:         tagNames,
	}

	submissionResponses := make([]ResponseSubmission, len(*s))

	for i, sub := range *s {
		var submissionFileName *string
		if sub.Attachment != nil {
			submissionFileName = &sub.Attachment.FileName
		}

		commentsResponse := make([]ResponseComment, len(sub.Comments))
		for j, c := range sub.Comments {
			commentsResponse[j] = ResponseComment{
				ID:        c.ID,
				Comment:   c.Comment,
				CreatedBy: string(c.CreatedByRole),
			}
		}

		var gradedBy *string
		if sub.GradedBy != nil {
			gb := string(*sub.GradedBy)
			gradedBy = &gb
		}

		submissionResponses[i] = ResponseSubmission{
			ID:           sub.ID,
			Answer:       sub.Answer,
			Point:        sub.Point,
			AttachmentID: sub.AttachmentID,
			FileName:     submissionFileName,
			Comments:     commentsResponse,
			GradedBy:     gradedBy,
		}
	}

	return ResponseDetailedAssignment{
		Assignment:  assignmentResponse,
		Submissions: submissionResponses,
	}
}

func ConvertSubmissionToResponse(s Submission) ResponseSubmission {
	const layout = "2006-01-02"

	var fileName *string
	if s.Attachment != nil {
		fileName = &s.Attachment.FileName
	}

	return ResponseSubmission{
		ID:				s.ID,
		Answer: 		s.Answer,
		Point:        	s.Point,
		GradedBy: 		(*string)(s.GradedBy),
		AttachmentID: 	s.AttachmentID,
		FileName:     	fileName,
	}
}