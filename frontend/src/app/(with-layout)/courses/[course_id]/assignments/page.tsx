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

type User = {
  username: string;
  name: string;
  email: string;
  role: string;
  faculty: string;
};

export default function Page({ user }: { user: User }) {
  const [assignment, setCourses] = useState<Assignment[] | null>(null);
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
      setCourses(data);
      setLoading(false);
    }

    loadAssignment();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!assignment || assignment.length === 0)
    return <div>No assignment found or you are not logged in.</div>;

  return (
    <div className="relative flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      { user.role === "teacher" && (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 md:top-6 md:right-6"
          onClick={handleClick}
        >
          <Plus /> New Assignment
        </Button>
      )}

      <div className="pt-10">
        {assignment.map((assignment, index) => (
          <AssignmentCards key={assignment.id} assignment={assignment} />
        ))}
      </div>
    </div>
  )
}
