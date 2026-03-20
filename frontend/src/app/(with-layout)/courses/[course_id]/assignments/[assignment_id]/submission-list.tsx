"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, CheckCircle, Clock, FileText } from "lucide-react"

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

interface SubmissionListProps {
  submissions: Submission[]
  selectedId: string | null
  onSelect: (submission: Submission) => void
  maxPoints: number
}

export function SubmissionList({ submissions, selectedId, onSelect, maxPoints }: SubmissionListProps) {
  const isGraded = (submission: Submission) => {
    return submission.graded_by && submission.graded_by.length > 0
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Submissions</span>
          <Badge variant="outline">{submissions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-2">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No submissions yet
              </p>
            ) : (
              submissions.map((submission) => (
                <button
                  key={submission.id}
                  onClick={() => onSelect(submission)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    selectedId === submission.id && "bg-muted"
                  )}
                >
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{submission.submitter}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {submission.attachment_id && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          File
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGraded(submission) ? (
                      <>
                        <span className="text-xs font-medium">
                          {submission.point}/{maxPoints}
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </>
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
