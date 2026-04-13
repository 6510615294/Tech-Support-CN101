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
import { Calendar, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation"

export function CourseCards({
  course,
  role,
}: {
  course: {
    id: string
    name: string
    schedule: string
    section: string
    semester: string
    teacher: string
  }
  role: string
}
) {
  const router = useRouter()

  const handleEdit = () => {
    router.push(`/courses/${course.id}/edit`)
  }

  return (
    <div className="p-3">
      <Card className="rounded-sm">
        <CardHeader>
          <Link
            href={`/courses/${course.id}`}
            className="flex-1"
          >
            <div>
              <CardTitle className="text-2xl h-12 line-clamp-1">
                {course.name}
              </CardTitle>
              <CardDescription className="text-gray-300">{course.teacher}</CardDescription>
            </div>
          </Link>
          {role === "teacher" && (
            <CardAction>
              <Button
                onClick={handleEdit}
                size={"icon-sm"}
                variant={"ghost"}
              >
                <Pencil />
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <Separator></Separator>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="pl-2">
            <span className="font-bold text-lg">Section </span>
            <span className="text-lg text-gray-300">{course.section}</span>
          </div>
          <div className="pl-2 pb-1">
            <span className="font-bold text-lg">Semester </span>
            <span className="text-lg text-gray-300">{course.semester}</span>
          </div>
          <Badge variant='outline' className="rounded-md">
            <div className="calendar-icon">
              <Calendar size={16} />
            </div>
            <span className="text-lg font-normal">Due: {course.schedule}</span>
          </Badge>
        </CardFooter>
      </Card>
    </div>
  )
}