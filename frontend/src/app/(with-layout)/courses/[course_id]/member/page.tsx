"use client"

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns";

type CourseMember = {
  user_id: string
  username: string
  en_name: string
  th_name: string
  email: string
  status: string
  role: string
}

export default function Page() {
  const [member, setMember] = useState<CourseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { course_id } = useParams();

  const loadMember = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/member`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        setError("Failed to load member data");
        return;
      }
      const data = await res.json();
      setMember(data);
    } catch (err) {
      setError("Failed to load member data Error: " + err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMember();
  }, [course_id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading member data…</p>
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

  if (!member) return null;

  return (
    <div
      className="mx-15 mt-5"
    >
      <h1>
        Member
      </h1>
      <DataTable
        columns={getColumns(course_id as string, loadMember)}
        data={member}
        filterProps={[
          {
            column_name: "username",
            column_display: "Username",
            placeholder: "Filter username..."
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
  )
}