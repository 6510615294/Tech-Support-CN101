"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, CheckCircle, Clock, MessageSquare, Eye, EyeOff, Send } from "lucide-react"
import { useMemo, useState, useEffect } from "react";
import { SelectLabel } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

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

interface GradingPanelProps {
  submissions: Submission[]
  selectedId: string | undefined
  onSelect: (submission: Submission) => void
  isAnonymous: boolean
  role?: string
  comments: Comment[]
  maxPoints: number
  currentGrade: number
  gradedBy: string
  onSubmitGrade: (grade: number, comment: string, visible: boolean) => void
}

type SortBy = "id" | "enName" | "thName" | "point"

export function GradingPanel({
  submissions,
  selectedId,
  onSelect,
  isAnonymous,
  role,
  comments,
  maxPoints,
  currentGrade,
  gradedBy,
  onSubmitGrade,
}: GradingPanelProps) {
  const existingComment = useMemo(() => {
    return role
      ? comments.find(c => c.commentator === role)
      : undefined;
  }, [comments, role]);

  const [sortBy, setSortBy] = useState<SortBy>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [grade, setGrade] = useState("");
  const [comment, setComment] = useState("");
  const [visibleToStudent, setVisibleToStudent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setGrade(currentGrade?.toString() ?? "");
    setComment(existingComment?.comment ?? "");
    setVisibleToStudent(existingComment?.visible ?? true);
  }, [currentGrade, existingComment]);

  const handleSubmit = async () => {
    if (!comment.trim() && !grade) return
    setIsSubmitting(true)
    try {
      await onSubmitGrade(Number(grade) || 0, comment, visibleToStudent)
      setComment("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCommentExpanded = (commentId: string) => {
    setExpandedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  const isGraded = (submission: Submission) => {
    return submission.graded_by && submission.graded_by.length > 0
  }

  const parseSubmitter = (submitter: string) => {
    const [id = "", enName = "", thName = ""] = submitter.split("|")
    return { id, enName, thName }
  }

  const sortedSubmissions = useMemo(() => {
    // When showName is false, force sort by point in ascending order
    const effectiveSortBy = isAnonymous ? "point" : sortBy
    const effectiveSortOrder = isAnonymous ? "asc" : sortOrder

    return [...submissions].sort((a, b) => {
      let result = 0

      if (effectiveSortBy === "point") {
        result = a.point - b.point
      } else {
        const parsedA = parseSubmitter(a.submitter)
        const parsedB = parseSubmitter(b.submitter)

        result = parsedA[effectiveSortBy].localeCompare(parsedB[effectiveSortBy], "th")
      }

      return effectiveSortOrder === "asc" ? result : -result
    })
  }, [submissions, sortBy, sortOrder, isAnonymous])

  const changeSubmission = (submissionId: string) => {
    const selectedSubmission = submissions.find((s) => s.id === submissionId)
    if (selectedSubmission) {
      onSelect(selectedSubmission)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments & Grade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Grade Display */}
          {gradedBy && (
            <div className="flex items-center justify-between rounded-md bg-muted p-3">
              <span className="text-sm text-muted-foreground">Current Grade</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {currentGrade}/{maxPoints}
                </span>
                <span className="text-xs text-muted-foreground">by {gradedBy}</span>
              </div>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Comments</h4>
              <div className="space-y-2">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.commentator}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {c.visible ? (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        )}
                      </Badge>
                    </div>
                    <p
                      className="text-sm whitespace-pre-wrap overflow-hidden w-full"
                      style={
                        expandedCommentIds[c.id]
                          ? {
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }
                          : {
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }
                      }
                    >
                      {c.comment}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleCommentExpanded(c.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expandedCommentIds[c.id] ? "Show less" : "Show more"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />
          <FieldGroup>
            <Field>
              <FieldLabel>Grade (max {maxPoints})</FieldLabel>
              <Input
                type="number"
                min={0}
                max={maxPoints}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder={`0 - ${maxPoints}`}
              />
            </Field>
            <Field>
              <FieldLabel>Comment</FieldLabel>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="resize-none"
              />
            </Field>
            <div className="flex items-center gap-2">
              <Checkbox
                id="visible"
                checked={visibleToStudent}
                onCheckedChange={(checked) => setVisibleToStudent(checked as boolean)}
              />
              <label htmlFor="visible" className="text-sm cursor-pointer">
                Visible to student
              </label>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Submit Grade & Comment
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </>
  )
}
