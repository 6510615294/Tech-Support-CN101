"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { AssignmentInfo } from "./assignment-info"
import { SubmissionList } from "./submission-list"
import { CommentGrade } from "./comment-grade"
import { AnswerBox } from "./answer-box"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { AlertCircle } from "lucide-react"

type Attachment = {
  id: string
  file_name: string
}

type Assignment = {
  id: string
  title: string
  description: string
  point: number
  attachments: Attachment[]
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
}

type Comment = {
  id: string
  comment: string
  commentator: string
  visible: boolean
}

type Submission = {
  id: string
  submitter: string
  answer: string
  point: number
  graded_by: string
  attachment_id: string
  file_name: string
  comments: Comment[]
}

export default function AssignmentDetailPage() {
  const { course_id, assignment_id } = useParams()

  const { user } = useAuth()
  const router = useRouter()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStudent, setIsStudent] = useState(true)

  useEffect(() => {
    if (!user?.token) {
      router.push("/")
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch assignment")
        const data = await res.json()
        setAssignment(data.assignment)
        setSubmissions(data.submissions || [])
        setIsStudent(data.role == "student")
        
        // For students, find their own submission
        if (data.role == "student" && data.submissions?.length > 0) {
          const mySubmission = data.submissions[0]
          setSelectedSubmission(mySubmission || null)
        } else if (data.role != "student" && data.submissions?.length > 0) {
          // For non-students, select first submission
          setSelectedSubmission(data.submissions[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, course_id, assignment_id, router, isStudent])

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
  }

  const handleSubmitGrade = async (grade: number, comment: string, visible: boolean) => {
    if (!selectedSubmission) return
    // TODO: Implement API call
    console.log("Submit grade:", { grade, comment, visible, submissionId: selectedSubmission.id })
  }

  const handleCodeChange = (code: string) => {
    console.log("Code changed")
  }

  const handleRunCode = async (code: string): Promise<string> => {
    // TODO: Implement API call to run code
    return "Output: Code execution result..."
  }

  const handleSubmit = async (answer: string, file?: File) => {
    // TODO: Implement API call
    console.log("Submit:", { answer, file })
  }

  // Student has valid submission only if attachment exists
  const studentHasSubmission = isStudent && selectedSubmission && selectedSubmission.attachment_id

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>Failed to load assignment</EmptyTitle>
            <EmptyDescription>{error || "Assignment not found"}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <BreadcrumbNav assignmentName={assignment.title} />

      {/* 1. Assignment Info */}
      <AssignmentInfo assignment={assignment} />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 4. Answer Box */}
        <div className="lg:col-span-2">
          {isStudent ? (
            <AnswerBox
              courseId={`${course_id}`}
              assignmentId={`${assignment_id}`}
              submissionId={selectedSubmission?.id || ""}
              attachmentId={selectedSubmission?.attachment_id}
              fileName={selectedSubmission?.file_name}
              isStudent={true}
              hasSubmission={!!studentHasSubmission}
              onSubmit={handleSubmit}
            />
          ) : selectedSubmission ? (
            <AnswerBox
              courseId={`${course_id}`}
              assignmentId={`${assignment_id}`}
              submissionId={selectedSubmission.id || ""}
              attachmentId={selectedSubmission.attachment_id}
              fileName={selectedSubmission.file_name}
              isStudent={false}
              hasSubmission={true}
              onCodeChange={handleCodeChange}
              onRunCode={handleRunCode}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a submission to view
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 2. Submission List - Only for non-students */}
          {!isStudent && (
            <SubmissionList
              submissions={submissions}
              selectedId={selectedSubmission?.id || null}
              onSelect={handleSelectSubmission}
              maxPoints={assignment.point}
            />
          )}

          {/* 3. Comments & Grade */}
          {(isStudent && studentHasSubmission) || (!isStudent && selectedSubmission) ? (
            <CommentGrade
              comments={selectedSubmission?.comments || []}
              currentGrade={selectedSubmission?.point || 0}
              maxPoints={assignment.point}
              gradedBy={selectedSubmission?.graded_by || ""}
              isStudent={isStudent}
              onSubmitGrade={handleSubmitGrade}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
