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

	return ResponseAssignment{
		ID:           a.ID,
		Title:        a.Title,
		Description:  a.Description,
		Point:        a.Point,
		StartDate:    a.StartDate.Format(layout),
		DueDate:      a.DueDate.Format(layout),
		CloseDate:    a.CloseDate.Format(layout),
		AttachmentID: a.AttachmentID,
		FileName:     a.Attachment.FileName,
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