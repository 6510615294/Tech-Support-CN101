import { CourseCards } from "@/components/course-cards";
import { MockCourseData } from "./mockup";


export default function Page() {
  return (
    <div className="
      grid grid-cols-1 gap-4 px-4 
      lg:px-6 
      sm:grid-cols-2
      md:grid-cols-3
      lg:grid-cols-3"
    >
      {MockCourseData.map((course, index) => (
        <CourseCards 
          key={course.id}
          course={course} 
        />
      ))}
    </div>
  )
}
