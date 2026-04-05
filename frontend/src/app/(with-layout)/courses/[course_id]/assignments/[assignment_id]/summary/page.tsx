"use client"

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import SummaryChart from "./summary-chart";
import { DataTable } from "@/components/data-table"
import { columns } from "./columns";
import { useAuth } from "@/lib/auth-context"

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

export default function Page() {
  const [view, setView] = useState<"chart" | "table">("chart")
  const [statistic, setStatistic] = useState<SubmissionStatistic | null>(null);
  const [submissionList, setSubmissionList] = useState<SubmissionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { course_id, assignment_id } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    async function loadSummary() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/summary`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      if (!res.ok) {
        setError("Failed to load assignment data");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStatistic(data.statistic);
      setSubmissionList(data.submission_list)
      setLoading(false);
    }
    loadSummary();
  }, [course_id, assignment_id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading assignment data…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-6 py-5 text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      </div>
    );

  if (!statistic || !submissionList) return null;

  return (
    <div>
      <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as "chart" | "table")}>
        <ToggleGroupItem value="chart">Chart</ToggleGroupItem>
        <ToggleGroupItem value="table">Table</ToggleGroupItem>
      </ToggleGroup>
  
      {view === "chart" && <SummaryChart statistic={statistic} />}
      {view === "table" &&
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
      }
    </div>
  )
}