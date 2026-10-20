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
import { AlertTriangle, Archive, Calendar, CheckCircle, Clock, LucideIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AssignmentDates {
  start_date: string;
  due_date: string;
  close_date: string;
}

interface StatusResult {
  status: string;
  icon: string;
  variant: BadgeVariant;
}

type BadgeVariant = 'destructive' | 'outline' | 'secondary' | 'default';

function checkAssignmentStatus(dates: AssignmentDates): StatusResult {
  const now = new Date(); 

  const start = new Date(dates.start_date);
  const due = new Date(dates.due_date);
  const close = new Date(dates.close_date);

  if (now > close) {
    return { status: 'Closed', icon: 'Archive', variant: 'destructive' };
  }

  if (now < start) {
    return { status: 'Upcoming', icon: 'Clock', variant: 'outline' };
  }

  if (now > due) {
    return { status: 'Overdue', icon: 'AlertTriangle', variant: 'secondary' };
  }

  return { status: 'Active', icon: 'CheckCircle', variant: 'default' };
}

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

export function AssignmentCards({
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
    tags: string[]
  }
}
) {
  const IconMap: Record<string, LucideIcon> = {
    Clock: Clock,
    CheckCircle: CheckCircle,
    AlertTriangle: AlertTriangle,
    Archive: Archive
  };

  const result = checkAssignmentStatus({
    start_date: assignment.start_date,
    due_date: assignment.due_date,
    close_date: assignment.close_date,
  })

  const StatusIcon = IconMap[result.icon];
  const formattedDue = formatDateToDisplay(assignment.due_date);
  const { course_id } = useParams()

  return (
    <div className="px-16 py-5 max-w-7xl m-auto">
      <Link 
        href={`/courses/${course_id}/assignments/${assignment.id}`} 
        className="block"
      >
      <Card className="w-full rounded-sm">
        <CardHeader>
          <CardTitle className="line-clamp-2 sm:line-clamp-1">
            <span className="text-2xl">Assignment: </span>
            <span className="text-2xl font-light">
              {assignment.title}
            </span>
          </CardTitle>
          <CardAction className="flex flex-col items-center">
            <Badge variant={result.variant} className="rounded-sm">
              <div className="flex items-center gap-1">
                <StatusIcon size={14} />
                <span className="font-normal">{result.status}</span>
              </div>
            </Badge>
            <span className="text-sm font-normal mt-1 text-gray-300">
              {assignment.point} Points 
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {assignment.tags.map((tag, index) => (
              <Badge key={assignment.id+index} variant='outline' className="rounded-md">
                <span className="text-sm font-normal">{tag}</span>
              </Badge>
            ))}
          </div>
          <Badge variant='outline' className="rounded-md">
            <div className="calendar-icon">
              <Calendar size={16} />
            </div>
            <span className="text-lg font-normal">Due: {formattedDue}</span>
          </Badge>
        </CardFooter>
      </Card>
      </Link>
    </div>
  )
}