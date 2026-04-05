"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface Course {
  id: string
  name: string
  schedule: string
  section: string
  semester: string
  teacher: string
}

interface EditCourseDialogProps {
  course: Course
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (course: Course) => void
}

export function EditCourseDialog({ course, open, onOpenChange, onUpdated }: EditCourseDialogProps) {
  const { user } = useAuth()
  const [form, setForm] = useState({ ...course })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Sync form when course prop changes (e.g. opening a different card)
  useEffect(() => {
    setForm({ ...course })
    setError("")
  }, [course])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.schedule || !form.section || !form.semester) {
      setError("All fields are required.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error("Failed to update course")

      const data = await res.json()
      onUpdated(data)
      onOpenChange(false)
      toast.success("Course updated", {
        description: "The course was updated successfully.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>
            Update the course details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="edit-name">Course Name</FieldLabel>
            <Input
              id="edit-name"
              name="name"
              placeholder="e.g. Introduction to Web Development"
              value={form.name}
              onChange={handleChange}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="edit-section">Section</FieldLabel>
              <Input
                id="edit-section"
                name="section"
                placeholder="e.g. A"
                value={form.section}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-semester">Semester</FieldLabel>
              <Input
                id="edit-semester"
                name="semester"
                placeholder="e.g. Spring 2026"
                value={form.semester}
                onChange={handleChange}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-schedule">Schedule</FieldLabel>
            <Input
              id="edit-schedule"
              name="schedule"
              placeholder="e.g. Mon/Wed 9:00 AM - 10:30 AM"
              value={form.schedule}
              onChange={handleChange}
            />
          </Field>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
