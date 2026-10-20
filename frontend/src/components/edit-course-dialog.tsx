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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { TimePicker24h } from "@/components/time-picker-24h"
import { toast } from "sonner"

interface Course {
  id: string
  name: string
  course_code: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
  credits: number
  section: string
  semester: string
  teacher: string
}

type CourseFormState = {
  name: string
  course_code: string
  day_of_week: string
  start_time: string
  end_time: string
  room: string
  credits: string
  section: string
  semester: string
}

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: string
}) {
  return (
    <FieldLabel htmlFor={htmlFor}>
      {children} <span className="text-destructive">*</span>
    </FieldLabel>
  )
}

function parseCourseSchedule(schedule?: string) {
  if (!schedule) return {}

  const normalized = schedule.trim()
  const dayMatch = normalized.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i)
  const timeMatch = normalized.match(/(\d{1,2}:\d{2})(?:\s*[AP]M)?\s*[-–]\s*(\d{1,2}:\d{2})(?:\s*[AP]M)?/i)

  return {
    day_of_week: dayMatch ? dayMatch[1][0].toUpperCase() + dayMatch[1].slice(1).toLowerCase() : "",
    start_time: timeMatch ? timeMatch[1] : "",
    end_time: timeMatch ? timeMatch[2] : "",
  }
}

function buildInitialForm(course: Course): CourseFormState {
  return {
    name: course.name || "",
    course_code: course.course_code || "",
    day_of_week: course.day_of_week || "",
    start_time: course.start_time || "",
    end_time: course.end_time || "",
    room: course.room || "",
    credits: course.credits ? String(course.credits) : "",
    section: course.section || "",
    semester: course.semester || "",
  }
}

interface EditCourseDialogProps {
  course: Course
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (course: Course) => void
}

export function EditCourseDialog({ course, open, onOpenChange, onUpdated }: EditCourseDialogProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<CourseFormState>(buildInitialForm(course))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Sync form when course prop changes (e.g. opening a different card)
  useEffect(() => {
    setForm(buildInitialForm(course))
    setError("")
  }, [course])

  // Fetch the latest course data when the dialog opens so the form is not
  // dependent on whatever the list page happened to keep in memory.
  useEffect(() => {
    if (!open || !user?.token) return

    const controller = new AbortController()

    const loadCourse = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          signal: controller.signal,
        })

        if (!res.ok) {
          return
        }

        const latestCourse: Course = await res.json()
        setForm(buildInitialForm(latestCourse))
      } catch {
        // Keep the current form values if the refresh fails.
      }
    }

    loadCourse()

    return () => controller.abort()
  }, [open, course.id, user?.token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.course_code || !form.day_of_week || !form.start_time || !form.end_time || !form.credits || !form.section || !form.semester) {
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
        body: JSON.stringify({
          ...form,
          credits: typeof form.credits === 'string' ? parseInt(form.credits) : form.credits
        }),
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
            <RequiredLabel htmlFor="edit-name">Course Name</RequiredLabel>
            <Input
              id="edit-name"
              name="name"
              placeholder="e.g. Introduction to Computer Programming"
              value={form.name}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <RequiredLabel htmlFor="edit-course_code">Course Code</RequiredLabel>
            <Input
              id="edit-course_code"
              name="course_code"
              placeholder="e.g. CN101"
              value={form.course_code}
              onChange={handleChange}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <RequiredLabel htmlFor="edit-day_of_week">Day of Week</RequiredLabel>
              <Select
                value={form.day_of_week}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, day_of_week: value }))
                  setError("")
                }}
              >
                <SelectTrigger id="edit-day_of_week" className="w-full">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <RequiredLabel htmlFor="edit-credits">Credits</RequiredLabel>
              <Input
                id="edit-credits"
                name="credits"
                type="number"
                placeholder="e.g. 3"
                value={form.credits}
                onChange={handleChange}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <RequiredLabel htmlFor="edit-start_time">Start Time</RequiredLabel>
              <TimePicker24h
                value={form.start_time}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, start_time: value }))
                  setError("")
                }}
                placeholder="09:30"
              />
            </Field>
            <Field>
              <RequiredLabel htmlFor="edit-end_time">End Time</RequiredLabel>
              <TimePicker24h
                value={form.end_time}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, end_time: value }))
                  setError("")
                }}
                placeholder="12:30"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-room">Room</FieldLabel>
            <Input
              id="edit-room"
              name="room"
              placeholder="e.g. EGR103"
              value={form.room}
              onChange={handleChange}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <RequiredLabel htmlFor="edit-section">Section</RequiredLabel>
              <Input
                id="edit-section"
                name="section"
                placeholder="e.g. 810001"
                value={form.section}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <RequiredLabel htmlFor="edit-semester">Semester</RequiredLabel>
              <Input
                id="edit-semester"
                name="semester"
                placeholder="e.g. 1/2565"
                value={form.semester}
                onChange={handleChange}
              />
            </Field>
          </div>
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
