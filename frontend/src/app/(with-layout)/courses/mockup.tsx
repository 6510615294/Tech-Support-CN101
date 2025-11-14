export interface Course {
    id: string;
    name: string;
    schedule: string;
    section: string;
    semester: string;
    teacher: string;
}

export type CourseList = Course[];

export const MockCourseData: CourseList = [
    {
        id: "vHx0Lg",
        name: "Introduction to Computer Science",
        schedule: "Mon 8:30-9:30",
        section: "CS101-A",
        semester: "Fall 2025",
        teacher: "Dr. Eleanor Vance",
    },
    {
        id: "TTnBW6",
        name: "Advanced Data Structures",
        schedule: "Tue 9:30-12:30",
        section: "CS350-B",
        semester: "Fall 2025",
        teacher: "Prof. Ben Carter",
    },
    {
        id: "TKwdxd",
        name: "Linear Algebra",
        schedule: "Fri 8:30-9:30",
        section: "MATH201-C",
        semester: "Spring 2026",
        teacher: "Dr. Julia Reyes",
    }
];