"use client"

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AssignmentCards } from "@/components/assignment-cards";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Assignment = {
  id: string
  title: string
  description: string
  point: number
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
}

export default function Page() {
  const [assignment, setAssignment] = useState<Assignment[] | null>(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const { course_id } = useParams()
  const router = useRouter();
  const pathname = usePathname();
  
  const handleClick = () => {
    const basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    router.push(`${basePath}/create`);
  };

  useEffect(() => {
    async function loadAssignment() {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      setAssignment(data.assignments);
      setUserRole(data.role);
      setLoading(false);
    }

    loadAssignment();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!assignment || assignment.length === 0)
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center">
          No assignment found or you are not logged in.
        </div>
      
        {userRole === "teacher" && (
          <div className="absolute right-6 top-6">
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm"
              onClick={handleClick}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Assignment
            </Button>
          </div>
        )}
      </div>
    );

  return (
    <div className="relative flex flex-col gap-1 py-1">
      { userRole == "teacher" && (
        <div className="flex justify-end mr-30">
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={handleClick}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Assignment
          </Button>
        </div>
      )}
      <div className="pt-1">
        {assignment.map((assignment, index) => (
          <AssignmentCards key={assignment.id} assignment={assignment} />
        ))}
      </div>
      <div className="h-1"></div>
    </div>
  )
}
