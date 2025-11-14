package models

type ResponseUserData struct {
	Username	string	`json:"username"`
	Name		string	`json:"name"`
	Email		string	`json:"email"`
	Faculty		string	`json:"faculty"`
	Role		string	`json:"role"`
}

type ResponseCourse struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Schedule string `json:"schedule"`
	Section  string `json:"section"`
	Semester string `json:"semester"`
	Teacher  string `json:"teacher"`
}

type ResponseEnrollment struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	CourseID  string `json:"course_id"`
	StudentID string `json:"student_id"`
}

type ResponseStudent struct {
	StudentID string `json:"student_id"`
	ThName    string `json:"th_name"`
	EngName   string `json:"eng_name"`
	Status    string `json:"status"`
}

type ResponseAssignment struct {
	ID				string         	`json:"id"`
	Title        	string         	`json:"title"`
	Description  	string         	`json:"description"`
	Point        	int16          	`json:"point"`
	StartDate    	string     		`json:"start_date"`
	DueDate      	string     		`json:"due_date"`
	CloseDate    	string     		`json:"close_date"`
	AttachmentID 	string         	`json:"attachment_id"`
	FileName   		string     		`json:"file_name"`
	Tags         	[]string		`json:"tags"`
}