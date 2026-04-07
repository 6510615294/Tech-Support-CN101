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
import { AssignmentActions } from "./assignment-actions"
import { CodeSection } from "./code-section"
import { GradingPanel } from "./grading-panel"


type Attachment = {
  id: string
  file_name: string
  file_type: string
  size: number
  created_at: string
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
  ai_agent: boolean
  assignment_prompt: string
  visible: boolean
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

  const [courseRole, setCourseRole] = useState<string | undefined>();
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStudent, setIsStudent] = useState(true)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [gradingError, setGradingError] = useState<string | null>(null)
  const [isGrading, setIsGrading] = useState(false)
  const [isEvaluate, setIsEvaluate] = useState(false)

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
        setCourseRole(data.role)
        
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
  }, [user, course_id, assignment_id, router])

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
  }

  const handleSubmitGrade = async (
    grade: number,
    comment: string,
    visible: boolean
  ) => {
    if (!selectedSubmission || !user) return
    setIsGrading(true)
    setGradingError(null)
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/submissions/${selectedSubmission.id}/grade-with-comment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            point: grade,
            comment,
            visible,
          }),
        }
      )
  
      if (!response.ok) {
        throw new Error("Failed to submit grade")
      }
  
      const result = await response.json()
      setSelectedSubmission((prev) => {
        if (!prev) return prev
      
        const newComment = {
          id: result.comment_id,
          comment: result.comment,
          commentator: result.graded_by,
          visible: result.visible,
        }
      
        const exists = prev.comments.some(
          (c) => c.commentator === newComment.commentator
        )
      
        return {
          ...prev,
          point: result.point,
          graded_by: result.graded_by,
          comments: exists
            ? prev.comments.map((c) =>
                c.commentator === newComment.commentator ? newComment : c
              )
            : [newComment, ...prev.comments],
        }
      })
      setSubmissions((prevList) =>
        prevList.map((s) => {
          if (s.id !== result.submission_id) return s;
      
          const newComment = {
            id: result.comment_id,
            comment: result.comment,
            commentator: result.graded_by,
            visible: result.visible,
          };
      
          const exists = s.comments.some(
            (c) => c.commentator === newComment.commentator
          );
      
          return {
            ...s,
            point: result.point,
            graded_by: result.graded_by,
            comments: exists
              ? s.comments.map((c) =>
                  c.commentator === newComment.commentator ? newComment : c
                )
              : [newComment, ...s.comments],
          };
        })
      );
    } catch (err) {
      setGradingError(
        err instanceof Error ? err.message : "An error occurred"
      )
    } finally {
      setIsGrading(false);
    }
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
  
  if (isEvaluate) {
    return (
      <div className="h-screen flex flex-col">
        <BreadcrumbNav/>
        <div className="grid grid-cols-4 flex-1">
          <div className="col-span-3 flex flex-col">
            <CodeSection
              courseId={`${course_id}`}
              assignmentId={`${assignment_id}`}
              submissionId={selectedSubmission?.id || ""}
              hasSubmission={true}
              isAnonymous={isAnonymous}
              toggleAnonymous={setIsAnonymous}
              leaveEvaluate={() => setIsEvaluate(false)}
            />
          </div>
          <div className="">
            <GradingPanel
              submissions={submissions}
              selectedId={selectedSubmission?.id ?? ""}
              onSelect={setSelectedSubmission}
              isAnonymous={isAnonymous}
              role={courseRole}
              comments={selectedSubmission?.comments || []}
              maxPoints={assignment.point}
              currentGrade={selectedSubmission?.point || 0}
              gradedBy={selectedSubmission?.graded_by || ""}
              onSubmitGrade={handleSubmitGrade}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbNav assignmentName={assignment.title} />
      
      <div className="grid gap-6 lg:grid-cols-3 px-6">
        <div className={isStudent ? "lg:col-span-3" : "lg:col-span-2"}>
          {/* 1. Assignment Info */}
          <AssignmentInfo assignment={assignment} />
        </div>
        {/* 2. Submission List - Only for non-students */}
        {!isStudent && (
          <div className="flex flex-col gap-4">
            <AssignmentActions
              courseId={`${course_id}`}
              assignment={assignment}
              evaluateMode={() => setIsEvaluate(true)}
              onAssignmentUpdated={setAssignment}
            />
            <SubmissionList
              submissions={submissions}
              selectedId={selectedSubmission?.id || null}
              onSelect={handleSelectSubmission}
              maxPoints={assignment.point}
              isAnonymous={isAnonymous}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 px-6">
        {/* 3. Answer Box */}
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
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a submission to view
              </CardContent>
            </Card>
          )}
        </div>
        {(isStudent && studentHasSubmission) || (!isStudent && selectedSubmission) ? (
          <CommentGrade
            role={courseRole}
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
  )
}