'use client'

import { SubmissionCard } from "./submission-card";
import React, { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"


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
  visible: boolean
}

type SubmissionCardsProps = {
  submissions: Submission[];
  showName: boolean;
  onSelect: (submission: Submission) => void;
};

type SortBy = "id" | "enName" | "thName" | "point"

export function SubmissionCards({
  submissions,
  showName,
  onSelect,
}: SubmissionCardsProps) {
  const [sortBy, setSortBy] = useState<SortBy>("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  
  const parseSubmitter = (submitter: string) => {
    const [id = "", enName = "", thName = ""] = submitter.split("|")
    return { id, enName, thName }
  }
  
  const sortedSubmissions = useMemo(() => {
    // When showName is false, force sort by point in ascending order
    const effectiveSortBy = showName ? sortBy : "point"
    const effectiveSortOrder = showName ? sortOrder : "asc"

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
  }, [submissions, sortBy, sortOrder, showName])
  
  return (
    <div className="space-y-2">
      {showName && (
        <div className="flex items-center gap-3 px-5">
          <Select
            value={sortBy}
            onValueChange={(v: SortBy) => setSortBy(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
        
            <SelectContent>
              <SelectItem value="id">Sort by ID</SelectItem>
              <SelectItem value="enName">Sort by English Name</SelectItem>
              <SelectItem value="thName">Sort by Thai Name</SelectItem>
              <SelectItem value="point">Sort by Point</SelectItem>
            </SelectContent>
          </Select>
        
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSortOrder((prev) =>
                prev === "asc" ? "desc" : "asc"
              )
            }
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {sortedSubmissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          showName={showName}
          sortBy={sortBy}
          onClick={() => onSelect(submission)}
        />
      ))}
    </div>
  );
}
