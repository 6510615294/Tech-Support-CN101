package models

func ConvertCourseToResponse(course *										Course) ResponseCourse {
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

	for i := range courses {
		response = append(response, ConvertCourseToResponse(&courses[i]))
	}

	return response
}

func ConvertCourseMemberToResponse(courseMember *CourseMember) ResponseMember {
	return ResponseMember{
		UserID:		courseMember.UserID,
		Username:	courseMember.User.Username,
		EnName:		courseMember.User.EnName,
		ThName:		courseMember.User.ThName,
		Email:		courseMember.User.Email,
		Status:		courseMember.Status,
		Role:		courseMember.Role,
	}
}

func ConvertAssignmentToResponse(
	a *Assignment,
	hasOverride bool,
	override *AssignmentOverride,
) ResponseAssignment {
	tagNames := make([]string, len(a.Tags))
	for i, tag := range a.Tags {
		tagNames[i] = tag.Name
	}

	const layout = "2006-01-02"

	attachments := make([]ResponseAttachment, len(a.Attachments))
	for i, att := range a.Attachments {
		attachments[i] = ResponseAttachment{
			ID:        att.ID,
			URL:       att.URL,
			FileName:  att.FileName,
			FileType:  att.FileType,
			CreatedAt: att.CreatedAt.Format(layout),
		}
	}

	dueDate := a.DueDate
	closeDate := a.CloseDate

	if hasOverride {
		dueDate = override.ExtendedDueDate
		closeDate = override.ExtendedDueDate
	}

	return ResponseAssignment{
		ID:          a.ID,
		Title:       a.Title,
		Description: a.Description,
		Point:       a.Point,
		StartDate:   a.StartDate.Format(layout),
		DueDate:     dueDate.Format(layout),
		CloseDate:   closeDate.Format(layout),
		Attachments: attachments,
		Tags:        tagNames,
		AIAgent: 	 a.AIAgent,
		Visible: 	 a.Visible,
	}
}


func ConvertAssignmentsToResponse(
	assignments []Assignment,
	overrides map[string]AssignmentOverride,
) []ResponseAssignment {

	response := make([]ResponseAssignment, 0, len(assignments))

	for i := range assignments {
		a := &assignments[i]

		override, ok := overrides[a.ID]

		response = append(response, ConvertAssignmentToResponse(a, ok, &override))
	}

	return response
}

func ConvertDetailedAssignmentToResponse(
	a *Assignment,
	s *[]Submission,
	o *AssignmentOverride,
) ResponseDetailedAssignment {

	tagNames := make([]string, len(a.Tags))
	for i, tag := range a.Tags {
		tagNames[i] = tag.Name
	}

	const layout = "2006-01-02"

	attachments := make([]ResponseAttachment, len(a.Attachments))
	for i, att := range a.Attachments {
		attachments[i] = ResponseAttachment{
			ID:        att.ID,
			URL:       att.URL,
			FileName:  att.FileName,
			FileType:  att.FileType,
			CreatedAt: att.CreatedAt.Format(layout),
		}
	}

	dueDate := a.DueDate
	closeDate := a.CloseDate

	if o != nil {
		dueDate = o.ExtendedDueDate
		closeDate = o.ExtendedDueDate
	}

	assignmentResponse := ResponseAssignment{
		ID:          a.ID,
		Title:       a.Title,
		Description: a.Description,
		Point:       a.Point,
		StartDate:   a.StartDate.Format(layout),
		DueDate:     dueDate.Format(layout),
		CloseDate:   closeDate.Format(layout),
		Attachments: attachments,
		Tags:        tagNames,
		AIAgent:     a.AIAgent,
		Visible:     a.Visible,
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
				Visible:   c.Visible,
			}
		}

		var gradedBy *string
		if sub.GradedBy != nil {
			gb := string(*sub.GradedBy)
			gradedBy = &gb
		}

		submissionResponses[i] = ResponseSubmission{
			ID:           sub.ID,
			Submitter:    sub.Student.Username + "|" + sub.Student.EnName + "|" + sub.Student.ThName,
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

func ConvertSubmissionToResponse(s *Submission) ResponseSubmission {

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
