'use client'

import { IconMap, IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
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
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Link 
        href={`/courses/${course_id}/assignments/${assignment.id}`} 
        className="block hover:shadow-lg transition-shadow duration-200 rounded-lg" // Add hover effects to the Link
      >
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {assignment.title}
          </CardTitle>
          <CardDescription>{assignment.description}</CardDescription>
          <CardAction className="flex flex-col items-center">
            <Badge variant={result.variant}>
              <StatusIcon size={16} className="mr-1" />
              <span>{result.status}</span>
            </Badge>
            <span className="text-sm font-medium mt-1 text-gray-600">
              {assignment.point} Points 
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {assignment.tags.map((tag, index) => (
              <Badge key={assignment.id+tag} variant='outline'>
                <span>{tag}</span>
              </Badge>
            ))}
          </div>
          <div className="text-muted-foreground">
            <Badge variant='outline'>
              <Calendar />
              <span><strong>Due:</strong> {formattedDue}</span>
            </Badge>
          </div>
        </CardFooter>
      </Card>
      </Link>
    </div>
  )
}