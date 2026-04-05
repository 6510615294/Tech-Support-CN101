"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, CheckCircle, Clock } from "lucide-react"
import { useMemo, useState } from "react";

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
  isAnonymous: boolean
}

type SortBy = "id" | "enName" | "thName" | "point"

export function SubmissionList({ submissions, selectedId, onSelect, maxPoints, isAnonymous = false }: SubmissionListProps) {
  const [sortBy, setSortBy] = useState<SortBy>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  
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
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex gap-1">
            <span>Submissions</span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setSortBy("id")}
            >
              id
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setSortBy("enName")}
            >
              en
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setSortBy("thName")}
            >
              th
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setSortBy("point")}
            >
              pt
            </Button>
          </div>
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
              sortedSubmissions.map((submission) => (
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
                    <p className="font-medium truncate">
                      {submission.submitter.split("|")[sortBy === "enName" ? 1 : sortBy === "thName" ? 2 : 0]}
                    </p>
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
