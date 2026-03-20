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
import { Pencil, BookOpen, Calendar, GraduationCap, AlertCircle, Plus } from "lucide-react"
import { useRouter } from "next/navigation";


type Course = {
  id: string;
  name: string;
  schedule: string;
  section: string;
  semester: string;
  teacher: string;
};

export default function Page() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("")
  const router = useRouter();
  
  const handleAddCourse = () => {
    router.push(`/courses/create`);
  };
  
  const handleEditCourse = (courseId: string) => {
    router.push(`/courses/${courseId}/edit`);
  };

  useEffect(() => {
    async function loadCourses() {
      if (!user?.token) return
      
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
        console.log(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses")
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
            <h1 className="text-2xl font-bold">Your Courses</h1>
            <p className="mt-1 text-muted-foreground">
              Browse and access your enrolled courses
            </p>
          </div>
          {user?.role === "teacher" && (
            <Button
              onClick={handleAddCourse}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
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
                  <Link href={`/courses/${course.id}/assignments`}>
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
                            <span>{course.teacher}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{course.schedule}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex items-center gap-2 border-t bg-muted/50 pt-4">
                        <Button className="flex-1">
                          View Assignments
                        </Button>
                      
                        {user?.role === "teacher" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 backdrop-blur-sm hover:bg-background border"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditCourse(course.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit course</span>
                          </Button>
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
      </>
    )
}
