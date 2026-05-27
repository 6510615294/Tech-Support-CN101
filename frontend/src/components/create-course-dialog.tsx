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
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { TimePicker24h } from "@/components/time-picker-24h"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: string
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-destructive">*</span>
    </Label>
  )
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Course</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new course.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <RequiredLabel htmlFor="name">Course Name</RequiredLabel>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Introduction to Computer Programming"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-2">
            <RequiredLabel htmlFor="course_code">Course Code</RequiredLabel>
            <Input
              id="course_code"
              name="course_code"
              placeholder="e.g. CN101"
              value={form.course_code}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <RequiredLabel htmlFor="day_of_week">Day of Week</RequiredLabel>
              <Select
                value={form.day_of_week}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, day_of_week: value }))
                  setError("")
                }}
              >
                <SelectTrigger id="day_of_week" className="w-full">
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
            </div>

            <div className="grid gap-2">
              <RequiredLabel htmlFor="credits">Credits</RequiredLabel>
              <Input
                id="credits"
                name="credits"
                type="number"
                placeholder="e.g. 3"
                value={form.credits}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <RequiredLabel htmlFor="start_time">Start Time</RequiredLabel>
              <TimePicker24h
                value={form.start_time}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, start_time: value }))
                  setError("")
                }}
                placeholder="09:30"
              />
            </div>

            <div className="grid gap-2">
              <RequiredLabel htmlFor="end_time">End Time</RequiredLabel>
              <TimePicker24h
                value={form.end_time}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, end_time: value }))
                  setError("")
                }}
                placeholder="12:30"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              name="room"
              placeholder="e.g. EGR103"
              value={form.room}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <RequiredLabel htmlFor="section">Section</RequiredLabel>
              <Input
                id="section"
                name="section"
                placeholder="e.g. 810001"
                value={form.section}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <RequiredLabel htmlFor="semester">Semester</RequiredLabel>
              <Input
                id="semester"
                name="semester"
                placeholder="e.g. 1/2565"
                value={form.semester}
                onChange={handleChange}
              />
            </div>
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
