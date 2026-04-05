"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface Course {
  id: string
  name: string
  schedule: string
  section: string
  semester: string
  teacher: string
}

interface CreateCourseDialogProps {
  onCreated: (course: Course) => void
}

const EMPTY_FORM = {
  name: "",
  schedule: "",
  section: "",
  semester: "",
}

export function CreateCourseDialog({ onCreated }: CreateCourseDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

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
    
    const payload = {
      name: form.name,
      schedule: form.schedule,
      section: form.section,
      semester: form.semester,
    };

    setIsSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to create course")

      const data = await res.json()
      onCreated(data)
      setForm(EMPTY_FORM)
      setOpen(false)
      toast.success("Course created", {
        description: "The course was created successfully.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new course.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Field>
            <FieldLabel htmlFor="name">Course Name</FieldLabel>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Introduction to Web Development"
              value={form.name}
              onChange={handleChange}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="section">Section</FieldLabel>
              <Input
                id="section"
                name="section"
                placeholder="e.g. A"
                value={form.section}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="semester">Semester</FieldLabel>
              <Input
                id="semester"
                name="semester"
                placeholder="e.g. Spring 2026"
                value={form.semester}
                onChange={handleChange}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="schedule">Schedule</FieldLabel>
            <Input
              id="schedule"
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
                setOpen(false)
                setForm(EMPTY_FORM)
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Create Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
