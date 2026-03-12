'use client'

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { FileBraces } from "lucide-react";

type SortBy = "id" | "enName" | "thName" | "point"

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

type Comment = {
    id: string
    comment: string
    commentator: string
}

type SubmissionCardProps = {
  submission: Submission;
  sortBy: SortBy
  showName: boolean;
  onClick?: () => void;
};

export function SubmissionCard({
  submission,
  sortBy = "id",
  showName = true,
  onClick,
}: SubmissionCardProps) {

  return (
    <div
      onClick={onClick}
      className="px-5"
    >
        <Card className="w-full rounded-sm">
        <CardHeader>
          {showName && (
            <div>
              {submission.submitter.split("|")[sortBy === "enName" ? 1 : sortBy === "thName" ? 2 : 0]}
              <CardDescription>
                {submission.submitter.replace(/\|/g, " ")}
              </CardDescription>
            </div>
          )}
            <CardDescription>
              {submission.file_name ? (
              <div>
                <Badge
                  key={`${submission.file_name}_${submission.attachment_id}`}
                  className="rounded-sm"
                >
                  <FileBraces className="mr-1 h-4 w-4" />
                  {submission.file_name}
                </Badge>
              </div>
              ) : (
              <p className="text-sm text-muted-foreground">
                No attachment
              </p>
              )}
            </CardDescription>
            <CardAction className="flex flex-col items-center">
                <span className="text-sm font-small">
                {submission.point} Points
                </span>
            </CardAction>
            </CardHeader>
        </Card>
    </div>
  )
}
