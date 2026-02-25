"use client"

import CourseForm from "@/components/course-form";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

type Course = {
  id: string;
  name: string;
  schedule: string;
  section: string;
  semester: string;
  teacher: string;
};

export default function Page() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { course_id } = useParams();
  
  useEffect(() => {
    async function loadCourse() {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setError("Failed to load course data");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setCourse(data.course);
      setLoading(false);
    }

    loadCourse();
  }, [course_id]);
    
  if (loading) return <div>Loading...</div>;
  
  if (error) return <div className="text-red-500">{error}</div>;
  
  if (!course) return <div>No course data found</div>;
  
  return (
    <div className="mt-10">
      <CourseForm 
        course={course}
      />
    </div>
  )
}