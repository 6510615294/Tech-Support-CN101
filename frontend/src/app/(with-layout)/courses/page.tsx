"use client";

import React, { useEffect, useState } from "react";
import { CourseCards } from "@/components/course-cards";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type Course = {
  id: string;
  name: string;
  schedule: string;
  section: string;
  semester: string;
  teacher: string;
};

export default function Page() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    const basePath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    router.push(`${basePath}/create`);
  };

  useEffect(() => {
    async function loadCourses() {
      const token = localStorage.getItem("token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
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

    loadCourses();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!courses || courses.length === 0)
    return <div><div className="flex justify-end px-4 lg:px-6 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
        >
          <Plus /> New Course
        </Button>
      </div>No courses found or you are not logged in.</div>;

  return (
    <div className="w-full relative">
      <div className="flex justify-end px-4 lg:px-6 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
        >
          <Plus /> New Course
        </Button>
      </div>
      <div className="
        grid grid-cols-1 gap-4 px-4 
        lg:px-6 
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-3
      ">
        {courses.map((course) => (
          <CourseCards key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
