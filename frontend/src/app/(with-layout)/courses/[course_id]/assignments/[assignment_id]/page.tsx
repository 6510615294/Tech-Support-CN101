"use client"

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AssignmentCard } from "@/components/assignment-card";
import { useParams } from "next/navigation";
import { SubmissionCards } from "@/components/submission-cards";
import { SubmissionDetail } from "@/components/submission-detail";
import SubmissionForm from "@/components/submission-form";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";

type Assignment = {
    id: string
    title: string
    description: string
    point: number
    start_date: string
    due_date: string
    close_date: string
    attachment_id: string
    file_name: string
    tags: string[]
}

type Submission = {
  id: string
  submitter: string
  answer: string
  point: number
  graded_by: string
  attachment_id: string
  file_name: string
  comments: Comment[]
}

type Comment = {
  id: string
  comment: string
  commentator: string
  visible: boolean
}

export default function Page() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const { course_id, assignment_id } = useParams()
  const router = useRouter();

  useEffect(() => {
    async function loadAssignment() {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}`, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const raw = await res.json();
      console.log(raw)
      const data = raw.data;
      setAssignment(data.assignment);
      setSubmissions(
        [...data.submissions].sort((a, b) =>
          a.submitter.localeCompare(b.submitter)
        )
      )
      setUserRole(raw.role);
      
        if (data.submissions && data.submissions.length > 0) {
          setSelectedSubmission(data.submissions[0]);
        }
      
        setLoading(false);
    }

    loadAssignment();
  }, []);

  const handleEdit = () => {
    router.push(`/courses/${course_id}/assignments/${assignment_id}/edit`);
  };
  
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to delete course");
        alert("Failed to delete assignment");
        return;
      }

      router.push(`/courses/${course_id}/assignments`);
      alert("Assignment deleted successfully!");
    } catch (err) {
      console.error("Error deleting course", err);
      alert("Something went wrong.");
    }
  }
  
  async function sendComment(
    comment: string,
    visible: boolean,
    submissionId: string
  ) {
    const token = localStorage.getItem("token")
  
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/submission/${submissionId}/comment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: comment,
          visible: visible,
        }),
      }
    )
  
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to send comment")
    }
  
    return res.json()
  }

  async function sendGrade(
    grade: number,
    submissionId: string
  ) {
    const token = localStorage.getItem("token")
  
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/submission/${submissionId}/grade`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          point: grade,
        }),
      }
    )
  
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to send grade")
    }
  
    return res.json()
  }

  async function toggleComment(
    commentID: string,
    submissionId: string
  ) {
    const token = localStorage.getItem("token")
  
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${course_id}/assignments/${assignment_id}/submission/${submissionId}/comment/${commentID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commentID: commentID,
        }),
      }
    )
  
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || "Failed to toggle comment")
    }
  
    return res.json()
  }

  if (loading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  return (
    <div>
      { userRole == "teacher" && (
        <div className="flex justify-end mr-18 gap-1">
          <Button
            variant="outline"
            size="sm"
            className="rounded-sm"
            onClick={handleEdit}
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit Assignment
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-sm"
            onClick={handleDelete}
          >
            <Trash className="w-4 h-4 mr-1" />
            Delete Assignment
          </Button>
        </div>
      )}
      <div className="flex gap-3 max-w-7xl m-auto">
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-hide w-full gap-3 min-h-0">
          <AssignmentCard key={assignment.id} assignment={assignment} />
          {userRole !== "student" && submissions && submissions.length > 0 ? (
            <SubmissionCards
              showName={true}
              submissions={submissions}
              onSelect={setSelectedSubmission}
            />
          ) : userRole === "student" ? (
            <SubmissionForm
              submission={selectedSubmission}
              maxPoint={assignment.point}
              isLoading={loading}
            />
          ) : (
            <></>
          )}
        </div>
    
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-hide w-full gap-3 min-h-0">
          {submissions && submissions.length > 0 ? (
            <SubmissionDetail
              key={selectedSubmission?.id}
              submission={selectedSubmission}
              maxPoint={assignment.point}
              role={userRole}
              onSave={async (grade, comment, isVisible) => {
                if (!selectedSubmission) return
                
                try {
                  const result = await sendComment(comment, isVisible, selectedSubmission.id)
                  console.log("comment created:", result)
            
                  setSelectedSubmission((prev) =>
                    prev
                      ? {
                        ...prev,
                        comments: prev.comments.some(c => c.id === result.id)
                          ? prev.comments.map(c =>
                              c.id === result.id ? result : c
                            )
                          : [...prev.comments, result],
                        }
                      : prev
                  )
                } catch (err) {
                  console.error(err)
                  alert("Failed to add comment")
                }
                
                try {
                  const result = await sendGrade(grade, selectedSubmission.id)
                  console.log("graded:", result)
        
                  setSubmissions((prev) =>
                    prev
                      ? prev.map((sub) =>
                        sub.id === selectedSubmission?.id
                          ? {
                              ...sub,
                              point: result.point,
                            }
                          : sub
                        )
                      : prev
                  )
                  
                  setSelectedSubmission((prev) =>
                    prev
                      ? {
                        ...prev,
                        point: result.point,
                        }
                      : prev
                  )
                } catch (err) {
                  console.error(err)
                  alert("Failed to update grade")
                }
              }}
              toggleComment={async (commentID) => {
                if (!selectedSubmission) return
                
                try {
                  const result = await toggleComment(commentID, selectedSubmission.id)
                  console.log("comment toggled:", result)
            
                  setSelectedSubmission((prev) =>
                    prev
                      ? {
                        ...prev,
                        comments: prev.comments.some(c => c.id === result.id)
                          ? prev.comments.map(c =>
                              c.id === result.id ? result : c
                            )
                          : [...prev.comments, result],
                        }
                      : prev
                  )
                } catch (err) {
                  console.error(err)
                  alert("Failed to toggle")
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground p-5">
                No Submission yet
            </p>    
          )}
        </div>
      </div>
    </div>
  )
}
