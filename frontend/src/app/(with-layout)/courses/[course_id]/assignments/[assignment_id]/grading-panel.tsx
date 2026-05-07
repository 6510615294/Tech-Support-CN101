"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, CheckCircle, Clock, MessageSquare, Eye, EyeOff, Send, X } from "lucide-react"
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
  isCollapsed?: boolean
  onToggleCollapse?: () => void
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
  isCollapsed: isCollapsedProp,
  onToggleCollapse,
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
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)

  const isCollapsed = onToggleCollapse !== undefined ? isCollapsedProp : internalIsCollapsed
  const handleToggleCollapse = onToggleCollapse || (() => setInternalIsCollapsed(!internalIsCollapsed))

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

  const parseSubmitter = (submitter: string) => {
    const [id = "", enName = "", thName = ""] = submitter.split("|")
    return { id, enName, thName }
  }

  const sortedSubmissions = useMemo(() => {
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

  if (onToggleCollapse && isCollapsed) {
    return null
  }

  return (
    <>
      {isCollapsed ? (
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors w-8 items-center justify-center"
          onClick={() => handleToggleCollapse()}
        >
          <CardContent className="flex items-center justify-center py-4 px-1">
            <div className="flex flex-col items-center gap-1">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 flex-none">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments & Grade
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleToggleCollapse()}
              >
                <X />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col flex-1 min-h-0 gap-4 pb-4">
            {/* Current Grade Display */}
            {gradedBy && (
              <div className="flex-none flex items-center justify-between rounded-md bg-muted p-3">
                <span className="text-sm text-muted-foreground">Current Grade</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {currentGrade}/{maxPoints}
                  </span>
                  <span className="text-xs text-muted-foreground">by {gradedBy}</span>
                </div>
              </div>
            )}

            {/* Comments & Form — scrollable, fills available space */}
            <div className="flex flex-col flex-1 min-h-0">
              <h4 className="text-sm font-medium shrink-0 mb-2">Comments</h4>

              <ScrollArea className="flex-1 min-h-0">
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-8 text-center mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  </div>
                )}
                <div className="space-y-2 pr-4">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium uppercase">{c.commentator}</span>
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
                      <p className="text-sm whitespace-pre-wrap break-all">
                        {expandedCommentIds[c.id]
                          ? c.comment
                          : c.comment.slice(0, 120) + (c.comment.length > 120 ? "…" : "")}
                      </p>
                      {c.comment.length > 120 && (
                        <button
                          type="button"
                          onClick={() => toggleCommentExpanded(c.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {expandedCommentIds[c.id] ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <FieldGroup className="pr-1">
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
                      placeholder="Add a comment"
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
                </FieldGroup>
              </ScrollArea>
            </div>

            {/* Submit Button — always sticks to bottom */}
            <div className="flex-none pt-2">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Submit Grade & Comment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}