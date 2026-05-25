"use client"

import { useRouter } from "next/navigation";
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ClipboardCheck, ClipboardList, BarChart3, Trash2, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import { EditAssignmentDialog } from "@/components/edit-assignment-dialog";
import { AssignmentAISetupDialog } from "@/components/assignment-ai-setup-dialog";
import { toast } from "sonner";

type Attachment = {
  id: string
  file_name: string
  file_type: string
  size: number
  created_at: string
}

type Assignment = {
  id: string
  title: string
  description: string
  point: number
  attachments: Attachment[]
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
  ai_agent: boolean
  ai_config_id?: string
  assignment_prompt: string
  visible: boolean
}

type EditableAssignment = {
  id: string
  title: string
  description: string
  point: number
  attachments: Attachment[]
  start_date: string
  due_date: string
  close_date: string
  tags: string[]
  ai_config_id: string
  prompt: string
  visible: boolean
}

interface AssignmentActionsProps {
  courseId: string
  assignment: Assignment
  evaluateMode: () => void
  onAssignmentUpdated: (assignment: Assignment) => void
}

export function AssignmentActions({
  courseId,
  assignment,
  evaluateMode,
  onAssignmentUpdated,
}: AssignmentActionsProps) {
  const { user } = useAuth()
  const router = useRouter();
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [isAISetupDialogOpen, setIsAISetupDialogOpen] = useState(false)
  const editableAssignment: EditableAssignment = {
    ...assignment,
    ai_config_id: assignment.ai_config_id ?? "",
    prompt: (assignment as { prompt?: string }).prompt ?? assignment.assignment_prompt ?? "",
  }

  async function handleDownloadAllSubmissions() {
    if (!user?.token) {
      return
    }

    try {
      setIsDownloadingAll(true)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/assignments/${assignment.id}/submissions/download`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      if (!res.ok) {
        console.error("Failed to download submissions")
        alert("Failed to download submissions")
        return
      }

      const blob = await res.blob()
      const safeAssignmentName = assignment.title
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, "_")
      const fileName = `${safeAssignmentName || "assignment"}_submissions.zip`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error downloading submissions", err)
      alert("Something went wrong.")
    } finally {
      setIsDownloadingAll(false)
    }
  }

  async function handleDelete() {
    if (!user) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/assignments/${assignment.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to delete course");
        alert("Failed to delete assignment");
        return;
      }

      router.push(`/courses/${courseId}/assignments`);
      alert("Assignment deleted successfully!");
    } catch (err) {
      console.error("Error deleting course", err);
      alert("Something went wrong.");
    }
  }

  async function handleStartAutoGrading() {
    if (!user?.token) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/assignments/${assignment.id}/auto-grading`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to delete course");
        toast.error("Failed to start AI grading", {
          description: "Please try again.",
        });
        return;
      }

      toast.success("AI grading queued", {
        description: "The grading job has been added to the queue.",
      });
    } catch (err) {
      console.error("Error deleting course", err);
      toast.error("Something went wrong", {
        description: "Unable to start AI grading.",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/*<Button
          variant={anonymousMode ? "default" : "outline"}
          size="sm"
          onClick={handleAnonymousMode}
          className="w-full justify-start gap-2"
        >
          <EyeOff className="h-4 w-4" />
          {anonymousMode ? "Anonymous On" : "Anonymous Mode"}
        </Button>*/}

        <Button
          size="sm"
          onClick={evaluateMode}
          className="w-full justify-start gap-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          Evaluate Mode
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => setIsAISetupDialogOpen(true)}
        >
          <ClipboardCheck className="h-4 w-4" />
          AI Grading
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => router.push("/ai/jobs")}
        >
          <ClipboardList className="h-4 w-4" />
          Grading Jobs
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadAllSubmissions}
          disabled={isDownloadingAll}
          className="w-full justify-start gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloadingAll ? "Downloading..." : "Download all submissions"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/courses/${courseId}/assignments/${assignment.id}/summary`)}
          className="w-full justify-start gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Summary
        </Button>

        <Separator />

        <EditAssignmentDialog
          assignment={editableAssignment}
          courseId={courseId}
          onUpdated={(updatedAssignment) => {
            const { prompt, ...updatedFields } = updatedAssignment
            onAssignmentUpdated({
              ...assignment,
              ...updatedFields,
              ai_config_id: updatedFields.ai_config_id || undefined,
              assignment_prompt: prompt,
            })
          }}
        />

        <AssignmentAISetupDialog
          open={isAISetupDialogOpen}
          onOpenChange={setIsAISetupDialogOpen}
          courseId={courseId}
          assignment={editableAssignment}
          onSaved={(updatedAssignment) => {
            const { assignment_prompt, ...updatedFields } = updatedAssignment
            onAssignmentUpdated({
              ...assignment,
              ...updatedFields,
              ai_config_id: updatedFields.ai_config_id || undefined,
              assignment_prompt,
            })
          }}
          onStartGrading={handleStartAutoGrading}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                <Trash2Icon />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the assignment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
