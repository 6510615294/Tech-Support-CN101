"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { ScrollArea } from "@/components/ui/scroll-area"
import { User, MessageSquare, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

type Comment = {
  id: string
  comment: string
  commentator: string
  visible: boolean
}

interface CommentSectionProps {
  comments: Comment[]
}

export function CommentSection({
  comments,
}: CommentSectionProps) {
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<string, boolean>>({})

  const toggleCommentExpanded = (commentId: string) => {
    setExpandedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  return (
    <Card className="border border-border flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-3 flex-none">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </CardTitle>
        </div>
      </CardHeader>

          <CardContent className="flex flex-col flex-1 min-h-0 pb-4">
            {/* Comments List — scrollable, fills available space */}
            <div className="flex flex-col flex-1 min-h-0">
              {comments.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-dashed py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
              ) : (
                <ScrollArea className="flex-1 min-h-0">
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
                </ScrollArea>
              )}
            </div>
          </CardContent>
      </Card>
  )
}