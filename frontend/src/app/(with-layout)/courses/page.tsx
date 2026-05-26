"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Pencil, BookOpen, Calendar, GraduationCap, AlertCircle, Trash2, MapPin } from "lucide-react"
import { CreateCourseDialog } from "@/components/create-course-dialog"
import { EditCourseDialog } from "@/components/edit-course-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type Course = {
  id: string;
  name: string;
  course_code: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  credits: number;
  section: string;
  semester: string;
  teacher: string;
};

function formatCourseSchedule(course: Course) {
  if (course.start_time && course.end_time) {
    return `${course.start_time} - ${course.end_time}`
  }

  return course.start_time || course.end_time || "-"
}

function formatTeacherName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default function Page() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("")
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingCourse || !user?.token) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${deletingCourse.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      })

      if (!res.ok) {
        toast.error("Failed to delete Course", {
          description: "Something went wrong. Please try again.",
        })
        return;
      }

      setCourses((prev) => prev.filter((c) => c.id !== deletingCourse.id))
      setDeletingCourse(null)
      toast.success("Course deleted", {
        description: "The course was deleted successfully.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    async function loadCourses() {
      if (!user?.token) return
      setIsLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch courses")
        }

        const data = await res.json()
        setCourses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses")
        setCourses([])
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadCourses()
    }
  }, [user])

  return (
    <>
      <BreadcrumbNav />
      <div className="flex-1 p-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Your Courses</h1>
            </div>
            <p className="mt-1 text-muted-foreground">
              Browse and access your enrolled courses
            </p>
          </div>
          {user?.role === "teacher" && (
            <CreateCourseDialog
              onCreated={(course) => setCourses((prev) => [...prev, course])}
            />
          )}
        </div>


        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>Failed to load courses</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </EmptyContent>
          </Empty>
        )}

        {/* Courses Grid */}
        {!isLoading && !error && courses && courses.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="relative">
                <Link href={`/courses/${course.id}`}>
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-lg cursor-pointer">
                    <CardHeader className={user?.role === "admin" ? "pr-12" : ""}>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-lg">{course.name}</CardTitle>
                        <Badge variant="outline">Section {course.section}</Badge>
                      </div>
                      <CardDescription>{course.semester}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 shrink-0" />
                          <span>{formatTeacherName(course.teacher)}</span>
                        </div>
                        {course.course_code && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 shrink-0" />
                            <span className="font-medium uppercase tracking-wide text-foreground/90">
                              {course.course_code}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            {course.day_of_week} {formatCourseSchedule(course)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{course.room ? `${course.room}` : "Room -"}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2 border-t bg-muted/50 pt-4">
                      <Button className="flex-1">
                        View Course
                      </Button>

                      {user?.role === "teacher" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 backdrop-blur-sm hover:bg-background border"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingCourse(course);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit course</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 backdrop-blur-sm hover:bg-background text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setDeletingCourse(course)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete course</span>
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && courses?.length === 0 && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No courses available</EmptyTitle>
              <EmptyDescription>
                Check back later for new courses
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

      <AlertDialog open={!!deletingCourse} onOpenChange={(open) => { if (!open) setDeletingCourse(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-primary">{deletingCourse?.name}</span>? This action cannot be undone and will remove all associated assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingCourse && (
        <EditCourseDialog
          course={editingCourse}
          open={!!editingCourse}
          onOpenChange={(open) => { if (!open) setEditingCourse(null) }}
          onUpdated={(updated) => {
            setCourses((prev) => prev.map((c) => c.id === updated.id ? updated : c))
            setEditingCourse(null)
          }}
        />
      )}
    </>
  )
}
