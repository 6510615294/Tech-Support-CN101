"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, Users } from "lucide-react"

type Course = {
    id: string
    name: string
}

export default function CourseLandingPage() {
    const { course_id } = useParams()
    const { user } = useAuth()
    const [course, setCourse] = useState<Course | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const loadCourse = async () => {
            if (!user?.token) return

            setIsLoading(true)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                })

                if (!res.ok) {
                    throw new Error("Failed to fetch course")
                }

                const data = await res.json()
                setCourse(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load course")
            } finally {
                setIsLoading(false)
            }
        }

        loadCourse()
    }, [user, course_id])

    return (
        <>
            <BreadcrumbNav courseName={course?.name} />
            <div className="flex-1 p-6">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-56" />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                        </div>
                    </div>
                )}

                {error && !isLoading && (
                    <Empty className="py-16">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <AlertCircle className="h-5 w-5" />
                            </EmptyMedia>
                            <EmptyTitle>Failed to load course</EmptyTitle>
                            <EmptyDescription>{error}</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button onClick={() => window.location.reload()}>Try Again</Button>
                        </EmptyContent>
                    </Empty>
                )}

                {!isLoading && !error && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold">{course?.name ?? "Course"}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Choose a section to continue</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Link href={`/courses/${course_id}/assignments`}>
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            <CardTitle>Assignments</CardTitle>
                                        </div>
                                        <CardDescription>View and manage assignments for this course</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline">Go to Assignments</Button>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link href={`/courses/${course_id}/members`}>
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            <CardTitle>Members</CardTitle>
                                        </div>
                                        <CardDescription>See enrolled members and course staff</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline">Go to Members</Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}