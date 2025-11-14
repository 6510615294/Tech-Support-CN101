'use client'

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link";
import { Separator } from "./ui/separator";
import { Calendar } from "lucide-react";

export function CourseCards({
  course,
}: {
  course: {
    id: string
    name: string
    course_date: string
    section: string
    semester: string
    teacher_name: string
  }
}
) {

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Link 
        href={`/courses/${course.id}/assignments`} 
        className="block hover:shadow-lg transition-shadow duration-200 rounded-lg"
      >
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-xl h-[3.5rem] overflow-hidden line-clamp-2">
            {course.name}
          </CardTitle>
          <CardDescription>{course.teacher_name}</CardDescription>
        </CardHeader>
        <Separator></Separator>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="">
            <span><strong>Section</strong> {course.section}</span>
          </div>
          <div className="">
            <span><strong>Semester</strong> {course.semester}</span>
          </div>
          <div className="">
            <Badge>
              <Calendar />
              <span>{course.course_date}</span>
            </Badge>
          </div>
        </CardFooter>
      </Card>
      </Link>
    </div>
  )
}