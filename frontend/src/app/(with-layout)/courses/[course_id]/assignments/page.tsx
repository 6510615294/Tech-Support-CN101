import { AssignmentCards } from "@/components/assignment-cards";
import { sampleAssignments } from "./mockup";



export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {sampleAssignments.map((assignment, index) => (
        <AssignmentCards 
          key={assignment.id}
          assignment={assignment} 
        />
      ))}
    </div>
  )
}
