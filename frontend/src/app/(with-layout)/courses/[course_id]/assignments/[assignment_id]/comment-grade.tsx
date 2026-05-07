"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { MessageSquare, Eye, EyeOff, Send, User } from "lucide-react"

type Comment = {
  id: string
  comment: string
  commentator: string
  visible: boolean
}

interface CommentGradeProps {
  role?: string
  comments: Comment[]
  currentGrade: number
  maxPoints: number
  gradedBy: string
  isStudent: boolean
  onSubmitGrade: (grade: number, comment: string, visible: boolean) => void
}

export function CommentGrade({
  role,
  comments,
  currentGrade,
  maxPoints,
  gradedBy,
  isStudent,
  onSubmitGrade,
}: CommentGradeProps) {
  const existingComment = useMemo(() => {
    return role
      ? comments.find(c => c.commentator === role)
      : undefined;
  }, [comments, role]);

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

  // Filter comments for student - only show visible ones
  const visibleComments = isStudent
    ? comments.filter((c) => c.visible)
    : comments

  return (
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
        {visibleComments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Comments</h4>
            <div className="space-y-2">
              {visibleComments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-md border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{c.commentator}</span>
                    </div>
                    {!isStudent && (
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
                    )}
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

        {/* Grade & Comment Input - Only for non-students */}
        {!isStudent && (
          <>
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
                  placeholder="Add a comment"
                  rows={3}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
