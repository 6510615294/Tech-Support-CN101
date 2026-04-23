"use client"

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import SummaryChart from "./summary-chart"
import { DataTable } from "@/components/data-table"
import { createColumns } from "./columns";
import { useAuth } from "@/lib/auth-context"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { Download } from "lucide-react"

interface Distribution {
  range_start: number;
  range_end: number;
  count: number;
}

interface SubmissionStatistic {
  students: number;
  submitted: number;
  incomplete: number;
  not_started: number;
  submission_rate: number;
  graded: number;
  ungrade: number;
  avg_score: number;
  highest_score: number;
  lowest_score: number;
  median_score: number;
  distribution: Distribution[];
}

type SubmissionList = {
  user_id: string
  student_id: string
  en_name: string
  th_name: string
  email: string
  point: number
  percentage: number
  submission_status: string
}

type AssignmentDetail = {
  title: string
}

type CourseDetail = {
  name: string
}

export default function Page() {
  const [view, setView] = useState<"chart" | "table">("chart")
  const [statistic, setStatistic] = useState<SubmissionStatistic | null>(null);
  const [submissionList, setSubmissionList] = useState<SubmissionList[]>([]);
  const [courseName, setCourseName] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { course_id, assignment_id } = useParams();
  const { user } = useAuth();
  
  // Create columns and dialog with proper props
  const { columns, dialog } = createColumns({
    courseId: course_id as string,
    assignmentId: assignment_id as string,
  });

  const handleExportCsv = () => {
    if (submissionList.length === 0) {
      return
    }

    const headers = [
      "student_id",
      "en_name",
      "th_name",
      "email",
      "submission_status",
      "point",
      "percentage",
    ]

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "")
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/\"/g, '""')}"`
      }
      return text
    }

    const rows = submissionList.map((item) => [
      escapeCsv(item.student_id),
      escapeCsv(item.en_name),
      escapeCsv(item.th_name),
      escapeCsv(item.email),
      escapeCsv(item.submission_status),
      escapeCsv(item.point),
      escapeCsv(item.percentage),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    const safeAssignmentName = assignmentName
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, "_")
    const fileName = `${safeAssignmentName || "assignment"}_summary.csv`

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const loadSummary = async () => {
    if (!user?.token) {
      return
    }

    setLoading(true)
    setError(null)

    const [summaryRes, assignmentRes, courseRes] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/summary`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          cache: "no-store",
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          cache: "no-store",
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          cache: "no-store",
        }
      ),
    ])

    if (!summaryRes.ok) {
      setError("Failed to load assignment data")
      setLoading(false)
      return
    }

    const summaryData = await summaryRes.json()
    setStatistic(summaryData.statistic)
    setSubmissionList(summaryData.submission_list)

    if (assignmentRes.ok) {
      const assignmentData = await assignmentRes.json()
      const assignment = assignmentData.assignment as AssignmentDetail | undefined
      setAssignmentName(assignment?.title || "")
    }

    if (courseRes.ok) {
      const courseData = await courseRes.json()
      const course = courseData as CourseDetail | undefined
      setCourseName(course?.name || "")
    }

    setLoading(false)
  }

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course_id, assignment_id, user?.token]);

  if (loading)
    return (
      <>
        <BreadcrumbNav courseName={courseName} assignmentName={assignmentName} />
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading assignment data...</p>
          </div>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <BreadcrumbNav courseName={courseName} assignmentName={assignmentName} />
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-6 py-5 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        </div>
      </>
    );

  if (!statistic || !submissionList) return null;

  return (
    <>
      <BreadcrumbNav courseName={courseName} assignmentName={assignmentName} />
      <div className="p-6 space-y-4">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => value && setView(value as "chart" | "table")}
          className="w-fit rounded-xl border bg-muted/40 p-1"
        >
          <ToggleGroupItem
            value="chart"
            className="h-9 rounded-lg px-4 text-sm font-semibold transition-all data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            Chart
          </ToggleGroupItem>
          <ToggleGroupItem
            value="table"
            className="h-9 rounded-lg px-4 text-sm font-semibold transition-all data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            Table
          </ToggleGroupItem>
        </ToggleGroup>

        {view === "chart" && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <SummaryChart statistic={statistic} />
          </div>
        )}
        {view === "table" && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <DataTable
              columnFilter={false}
              columns={columns}
              data={submissionList}
              filterProps={[
                {
                  column_name: "student_id",
                  column_display: "Student ID",
                  placeholder: "Filter by student id..."
                },
                {
                  column_name: "en_name",
                  column_display: "English Name",
                  placeholder: "Filter by name..."
                },
                {
                  column_name: "th_name",
                  column_display: "Thai Name",
                  placeholder: "Filter by name..."
                },
                {
                  column_name: "status",
                  column_display: "Status",
                  placeholder: "Filter by status..."
                }
              ]}
            />
          </div>
        )}
      </div>
      {dialog}
    </>
  )
}