'use client'

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileBraces } from "lucide-react";
import Link from "next/link";

function formatDateToDisplay(isoString: string): string {
  const date = new Date(isoString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    
    timeZone: 'Asia/Bangkok'
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function AssignmentCard({
  assignment,
}: {
  assignment: {
    id: string
    title: string
    description: string
    point: number
    start_date: string
    due_date: string
    close_date: string
    attachment_id: string
    file_name: string
    tags: string[]
  }
}
) {
  const formattedDue = formatDateToDisplay(assignment.due_date);
  const formattedClose = formatDateToDisplay(assignment.close_date);

  return (
    <div className="p-5">
      <Card className="w-full rounded-sm">
        <CardHeader>
        <CardTitle className="truncate min-w-0">
          <span className="font-normal text-3xl">
            {assignment.title}
          </span>
        </CardTitle>
        <CardDescription>
          Due {formattedDue}<br />
          Close {formattedClose}<br />
        </CardDescription>
        <CardAction className="flex flex-col items-center">
            
          <span className="text-sm font-normal">
            {assignment.point} Points
          </span>
        </CardAction>
        </CardHeader>
        <CardFooter className="flex flex-col items-start gap-1.5 text-sm w-full min-w-0">
          <span>Descriptions</span>
        
          <div className="w-full min-w-0 break-words whitespace-pre-wrap">
            {assignment.description}
          </div>
          {assignment.tags.length > 0 && (
          <div className="flex flex-col gap-1">
            Tags
            <div className="line-clamp-1 flex gap-2 font-medium">
              {assignment.tags.map((tag, index) => (
              <Badge key={assignment.id+tag} variant='outline' className="rounded-sm">
                <span className="text-sm font-normal">{tag}</span>
              </Badge>
              ))}
            </div>
          </div>
          )}
          {assignment.file_name && (
          <Link
            className="flex flex-col gap-1"
            href={""}
          >
            Attachment
            <Badge
              key={`${assignment.file_name}_${assignment.attachment_id}`}
              className="rounded-sm"
            >
              <FileBraces className="mr-1 h-4 w-4" />
              {assignment.file_name}
            </Badge>
          </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}