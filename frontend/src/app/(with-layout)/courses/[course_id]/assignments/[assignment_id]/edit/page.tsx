"use client"

import AssignmentForm from "@/components/assignment-form";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

type attachment = {
  id: string
  file_name: string
}

type Assignment = {
  id: string
  title: string
  description: string
  point: number
  attachments: attachment[]
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
  ai_agent: boolean
  visible: boolean
};

export default function Page() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { course_id, assignment_id } = useParams();
  
  useEffect(() => {
    async function loadAssignment() {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Failed to load assignment data");
        setLoading(false);
        return;
      }

      const raw = await res.json();
      setAssignment(raw.assignment.assignment);
      setLoading(false);
    }

    loadAssignment();
  }, [course_id, assignment_id]);
    
  if (loading) return <div>Loading...</div>;
  
  if (error) return <div className="text-red-500">{error}</div>;
  
  if (!assignment) return <div>No assignment data found</div>;
  
  return (
    <div className="mt-10">
      <AssignmentForm 
        assignment={assignment}
      />
    </div>
  )
}