"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select"
import {
  LayoutTemplate,
  Search,
  Code,
  Star,
  Trash2,
  Pencil,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react"
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import { getFileIcon } from "@/lib/file"
import { TipTapTextEditor } from "@/components/ui/tiptap"
import SmartDatetimeInputByTui from "@/components/smart-datetime-input2"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from "@/components/ui/empty"
import { toast } from "sonner"
import { CreateAssignmentTemplateDialog } from "@/components/create-template-dialog"
import { EditTemplateDialog } from "@/components/edit-template-dialog"

type Course = {
  id: string
  name: string
}

type Attachment = {
  id: string
  file_name: string
  file_type: string
  size: number
  created_at: string
}

type AssignmentTemplate = {
  id: string
  title: string
  description: string
  point: number
  attachments: Attachment[]
  tags: string[]
  ai_agent: boolean
  assignment_prompt: string
}

type AssignmentForm = {
  start_date: Date | null
  due_date: Date | null
  close_date: Date | null
}

const DEFAULT_FORM: AssignmentForm = {
  start_date: null,
  due_date: null,
  close_date: null,
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([])
  const [filtered, setFiltered] = useState<AssignmentTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<AssignmentTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AssignmentTemplate | null>(null)
  const [targetCourse, setTargetCourse] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<AssignmentTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()
  const [form, setForm] = useState<AssignmentForm>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const tmplRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        if (!tmplRes.ok) {
          throw new Error("Failed to fetch templates")
        }
        const tmplData = await tmplRes.json()
        
        const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        if (!courseRes.ok) {
          throw new Error("Failed to fetch courses")
        }
        const courseData = await courseRes.json()
        
        setCourses(courseData)
        setTemplates(tmplData)
        setFiltered(tmplData)
      } catch (err) {
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        })
        setTemplates([])
        setError(err instanceof Error ? err.message : "Failed to load templates")
      } finally {
        setIsLoading(false)
      }
    }
    if (user?.token) fetchData()
  }, [user])

  useEffect(() => {
    let result = templates
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    setFiltered(result)
  }, [search, templates])

  const handleUse = (tpl: AssignmentTemplate) => {
    setSelected(tpl)
    setTargetCourse("")
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setForm(DEFAULT_FORM)
    setErrors({})
    setTargetCourse("")
    setDialogOpen(open)
  }

  const set = <K extends keyof AssignmentForm>(
    key: K,
    value: AssignmentForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.start_date) e.start_date = "Start date is required"
    if (!form.due_date) e.due_date = "Due date is required"
    if (form.start_date && form.due_date && form.due_date < form.start_date)
      e.due_date = "Due date must be on or after start date"
    if (form.close_date && form.due_date && form.close_date < form.due_date)
      e.close_date = "Close date must be on or after due date"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirmUse = async () => {
    if (!selected || !user || !targetCourse) return
    
    if (!validate()) return
    
    setIsCreating(true)
    
    // Set close date to due date if not provided
    const closeDate = form.close_date || form.due_date
    
    try {
      const formData = new FormData()

      formData.append("title", selected.title)
      formData.append("description", selected.description)
      formData.append("point", String(selected.point))
      formData.append("start", form.start_date!.toISOString())
      formData.append("due", form.due_date!.toISOString())
      formData.append("close", closeDate!.toISOString())

      if (selected.ai_agent !== undefined) {
        formData.append("ai_agent", String(selected.ai_agent))
      }
      
      if (selected.ai_agent) {
        formData.append("assignment_prompt", String(selected.assignment_prompt))
      }

      if (selected.tags) {
        selected.tags.forEach(tag => formData.append("tags", tag))
      }

      if (selected.attachments && selected.attachments.length > 0) {
        selected.attachments.forEach((attachment) => {
          formData.append("attachments", attachment.id)
        })
      }
      
      formData.append("visible", String(true))

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${targetCourse}/assignments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`, 
        },
        body: formData,
      })

      if (!res.ok) {
        toast.error("Failed to create Template", {
          description: "Something went wrong. Please try again.",
        })
        return
      }

      toast.success("Assignment created", {
        description: "The assignment was created successfully.",
      })
      setDialogOpen(false)
      setForm(DEFAULT_FORM)
      setErrors({})
    } catch (err) {
      console.error(err)
      toast.error("Failed to create Assignment", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      
      if (!res.ok) {
        toast.error("Failed to delete Template", {
          description: "Something went wrong. Please try again.",
        })
        return;
      }
      
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      toast.success("Template deleted", {
        description: "The template was deleted successfully.",
      })
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Template", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <BreadcrumbNav />

      <div className="flex-1 p-6">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Assignment Templates</h1>
            </div>
            <p className="mt-1 text-muted-foreground">
              Reusable assignment templates to speed up course creation.
            </p>
          </div>
          <CreateAssignmentTemplateDialog
            onCreated={(newTemplate) => {
              setTemplates((prevTemplates) => [...prevTemplates, newTemplate]);
            }}
          />
        </div>

        {/* Filters */}
        <div className="relative mb-6 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates by title, description or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            {filtered.length} template{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>Failed to load templates</EmptyTitle>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </EmptyContent>
          </Empty>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 && !error ? (
          <Empty className="py-20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutTemplate className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No templates found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or filters
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : !error && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tpl) => (
              <Card key={tpl.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base leading-snug">{tpl.title}</CardTitle>
                  <CardAction>
                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                      <Star className="h-3.5 w-3.5" />
                      {tpl.point} pts
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className="flex-1 pb-3 space-y-3">
                  {/* Tags */}
                  {tpl.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tpl.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex flex-col gap-1">
                      {tpl.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm hover:bg-muted transition-colors"
                        >
                          {getFileIcon(attachment.file_type, 4)}
                          {attachment.file_name}
                        </div>
                      ))}
                    </span>
                  </div>

                  {/* Prompt preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 pl-2">
                    {tpl.assignment_prompt}
                  </p>
                </CardContent>

                <CardFooter className="border-t pt-3 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingTemplate(tpl);
                    }}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(tpl)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    className="ml-auto gap-1.5 h-8"
                    size="sm"
                    onClick={() => handleUse(tpl)}
                  >
                    Use Template
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Use Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange} key={dialogOpen ? "open" : "closed"}>
        <DialogContent className="max-w-2xl" >
          <DialogHeader>
            <DialogTitle>Use Template</DialogTitle>
            <DialogDescription>
              Create a new assignment from <strong>Template</strong>. Select which course to add it to. 
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              {/* Template preview */}
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3 overflow-y-auto no-scrollbar max-h-[400px]">
                
                {/*Title & Point*/}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{selected.title}</span>
                  <Badge
                    variant="secondary"
                  >
                    <Star className="h-3.5 w-3.5" /> {selected.point} pts
                  </Badge>
                </div>
                
                {/*Description*/}
                <div className="rounded-md bg-background border">
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/60">
                    <span className="text-xs text-muted-foreground">Description</span>
                  </div>
                  <div className="max-h-[250px] min-h-[100px] overflow-y-auto border rounded-md p-2 no-scrollbar">
                    <TipTapTextEditor
                      value={selected.description}
                      editable={false}
                      onChange={() => { }}
                    />
                  </div>
                </div>
                
                {/*Tags*/}
                {selected.tags.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {selected.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                
                {/*Attachments*/}
                {selected.attachments.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">Attachments</span>
                    <div className="flex flex-col gap-1">
                      {selected.attachments.map((attachment) => (
                        <Badge
                          key={attachment.id}
                          variant="outline"
                        >
                          {getFileIcon(attachment.file_type, 4)}
                          <span className="truncate max-w-[200px]">
                            {attachment.file_name}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
                
                {/*Assignment Prompt*/}
                {selected.ai_agent && (
                  <div className="rounded-md bg-background border overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/60">
                      <Code className="h-4 w-4 text-muted-foreground px-0" />
                      <span className="text-xs text-muted-foreground">Assignment Instruction/Prompt</span>
                    </div>
                    <div className="max-h-[250px] min-h-[100px] overflow-y-auto border rounded-md p-2 no-scrollbar">
                      <pre>
                        {selected.assignment_prompt}
                      </pre>
                    </div>
                  </div>
                )}
                {/* Dates */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="start_date">Start Time</Label>
                    <SmartDatetimeInputByTui
                      value={form.start_date}
                      onChange={(e) => set("start_date", e)}
                      placeholder="e.g. Tomorrow morning 9am"
                    />
                    {errors.start_date && <p className="text-xs text-destructive">{errors.start_date}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="due_date">Due Date</Label>
                    <SmartDatetimeInputByTui
                      value={form.due_date}
                      onChange={(e) => set("due_date", e)}
                      placeholder="e.g. Tomorrow morning 9am"
                    />
                    {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="close_date">Close Date</Label>
                    <SmartDatetimeInputByTui
                      value={form.close_date}
                      onChange={(e) => set("close_date", e)}
                      placeholder="e.g. Tomorrow morning 9am"
                    />
                    {errors.close_date && <p className="text-xs text-destructive">{errors.close_date}</p>}
                  </div>
                </div>
              </div>

              {/* Target course */}
              <div className="flex flex-row justify-between items-center">
                <label className="text-sm font-medium">Add to course</label>
                <Select value={targetCourse} onValueChange={setTargetCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) =>
                      <SelectItem key={course.id} value={course.id}>
                        {`${course.name} (${course.id})`}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUse} 
              disabled={!targetCourse || isCreating} 
              className="gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isCreating ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assignment template?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-bold text-foreground">{deleteTarget?.title}</span> will be permanently
              deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => { if (!open) setEditingTemplate(null) }}
          onUpdated={(updated) => {
            setTemplates((prev) => prev.map((t) => t.id === updated.id ? updated : t))
            setEditingTemplate(null)
          }}
        />
      )}
    </>
  )
}
