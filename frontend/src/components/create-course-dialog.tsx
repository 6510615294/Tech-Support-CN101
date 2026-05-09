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

interface CreateCourseDialogProps {
  onCreated: (course: Course) => void
}

const EMPTY_FORM = {
  name: "",
  course_code: "",
  day_of_week: "",
  start_time: "",
  end_time: "",
  room: "",
  credits: "",
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

    if (!form.name || !form.course_code || !form.day_of_week || !form.start_time || !form.end_time || !form.credits || !form.section || !form.semester) {
      setError("All fields are required.")
      return
    }

    const payload = {
      name: form.name,
      course_code: form.course_code,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room,
      credits: parseInt(form.credits),
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
              placeholder="e.g. Introduction to Computer Programming"
              value={form.name}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="course_code">Course Code</FieldLabel>
            <Input
              id="course_code"
              name="course_code"
              placeholder="e.g. CN101"
              value={form.course_code}
              onChange={handleChange}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="day_of_week">Day of Week</FieldLabel>
              <select
                id="day_of_week"
                name="day_of_week"
                value={form.day_of_week}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, day_of_week: e.target.value }))
                  setError("")
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="credits">Credits</FieldLabel>
              <Input
                id="credits"
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
              <FieldLabel htmlFor="start_time">Start Time</FieldLabel>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={form.start_time}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="end_time">End Time</FieldLabel>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={form.end_time}
                onChange={handleChange}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="room">Room (Optional)</FieldLabel>
            <Input
              id="room"
              name="room"
              placeholder="e.g. EGR103"
              value={form.room}
              onChange={handleChange}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="section">Section</FieldLabel>
              <Input
                id="section"
                name="section"
                placeholder="e.g. 810001"
                value={form.section}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="semester">Semester</FieldLabel>
              <Input
                id="semester"
                name="semester"
                placeholder="e.g. 1/2565"
                value={form.semester}
                onChange={handleChange}
              />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
