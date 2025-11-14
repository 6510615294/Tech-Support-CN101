export interface Course {
    id: string;
    name: string;
    course_date: string;
    section: string;
    semester: string;
    teacher_name: string;
}

export type CourseList = Course[];

export const MockCourseData: CourseList = [
    {
        id: "vHx0Lg",
        name: "Introduction to Computer Science",
        course_date: "Mon 8:30-9:30",
        section: "CS101-A",
        semester: "Fall 2025",
        teacher_name: "Dr. Eleanor Vance",
    },
    {
        id: "TTnBW6",
        name: "Advanced Data Structures",
        course_date: "Tue 9:30-12:30",
        section: "CS350-B",
        semester: "Fall 2025",
        teacher_name: "Prof. Ben Carter",
    },
    {
        id: "TKwdxd",
        name: "Linear Algebra",
        course_date: "Fri 8:30-9:30",
        section: "MATH201-C",
        semester: "Spring 2026",
        teacher_name: "Dr. Julia Reyes",
    }
];