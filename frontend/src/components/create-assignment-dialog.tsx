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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X, Paperclip, Upload, FolderOpen, FileText, File as FileIcon, Search, LayoutTemplate, ChevronDown, Check } from "lucide-react"
import { TipTapTextEditor } from "./ui/tiptap"
import { toast } from "sonner"
import SmartDatetimePickerByTui from "./smart-datetime-input2"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

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
  assignment_prompt: string
  visible: boolean
}

interface CreateAssignmentDialogProps {
  courseId: string
  onCreated: (assignment: Assignment) => void
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
  title: string
  description: string
  point: number
  start_date: Date | null
  due_date: Date | null
  close_date: Date | null
  ai_agent: boolean
  assignment_prompt: string
  visible: boolean
}

const DEFAULT_FORM: AssignmentForm = {
  title: "",
  description: "",
  point: 10,
  start_date: null,
  due_date: null,
  close_date: null,
  ai_agent: false,
  assignment_prompt: "",
  visible: true,
}

export function CreateAssignmentDialog({ courseId, onCreated }: CreateAssignmentDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AssignmentForm>(DEFAULT_FORM)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [templateSearch, setTemplateSearch] = useState("")
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AssignmentTemplate | null>(null)

  // Attachments
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [attachmentTabOpen, setAttachmentTabOpen] = useState(false)
  const [attachmentSearch, setAttachmentSearch] = useState("")

  const MAX_FILES = 5
  const totalAttachments = selectedAttachments.length + uploadedFiles.length
  const normalizedTemplateSearch = templateSearch.toLowerCase()
  const filteredTemplates = templates.filter((t) =>
    t.title.toLowerCase().includes(normalizedTemplateSearch) ||
    t.description.toLowerCase().includes(normalizedTemplateSearch) ||
    t.tags.some((tag) => tag.toLowerCase().includes(normalizedTemplateSearch))
  )
  const templateDropdownHeight = Math.min(Math.max(filteredTemplates.length * 92 + 8, 120), 420)

  const set = <K extends keyof AssignmentForm>(
    key: K,
    value: AssignmentForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const fetchTemplates = async () => {
    if (templates.length > 0) return
    setIsLoadingTemplates(true)
    try {
      const tmplRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })

      if (!tmplRes.ok) {
        toast.error("Failed to fetch Templates", {
          description: "Something went wrong. Please try again.",
        })
        return;
      }

      const data = await tmplRes.json()
      setTemplates(Array.isArray(data) ? data : [])
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const applyTemplate = (tpl: AssignmentTemplate) => {
    setForm((prev) => ({
      ...prev,
      title: tpl.title,
      description: tpl.description,
      point: tpl.point,
      ai_agent: tpl.ai_agent,
      assignment_prompt: tpl.assignment_prompt,
    }))
    setTags(tpl.tags)
    setSelectedAttachments(tpl.attachments)
    setSelectedTemplate(tpl)
    setTemplatePickerOpen(false)
    setTemplateSearch("")
  }

  const clearTemplate = () => {
    setSelectedTemplate(null)
    setForm(DEFAULT_FORM)
    setTags([])
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mime: string) => {
    if (mime.includes("pdf") || mime.includes("word")) return FileText
    return FileIcon
  }

  const fetchExistingAttachments = async () => {
    if (existingAttachments.length > 0) return
    setIsLoadingAttachments(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await res.json()
      setExistingAttachments(data ?? [])
    } finally {
      setIsLoadingAttachments(false)
    }
  }

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setUploadedFiles((prev) => {
      const combined = [...prev, ...files]
      const remaining = MAX_FILES - selectedAttachments.length
      return combined.slice(0, remaining)
    })
    e.target.value = ""
  }

  const removeUploadedFile = (index: number) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))

  const toggleExistingAttachment = (att: Attachment) => {
    setSelectedAttachments((prev) => {
      const exists = prev.find((a) => a.id === att.id)
      if (exists) return prev.filter((a) => a.id !== att.id)
      if (prev.length + uploadedFiles.length >= MAX_FILES) return prev
      return [...prev, att]
    })
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput("")
  }

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = "Title is required"
    if (!form.description.trim()) e.description = "Description is required"
    if (form.point <= 0) e.point = "Points must be greater than 0"
    if (!form.start_date) e.start_date = "Start date is required"
    if (!form.due_date) e.due_date = "Due date is required"
    if (!form.close_date) e.close_date = "Close date is required"
    if (form.start_date && form.due_date && form.due_date <= form.start_date)
      e.due_date = "Due date must be after start date"
    if (form.due_date && form.close_date && form.close_date < form.due_date)
      e.close_date = "Close date must be on or after due date"
    if (form.ai_agent && !(form.assignment_prompt ?? "").trim())
      e.assignment_prompt = "Prompt is required when AI Agent is enabled"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const formData = new FormData();

      if (!form.start_date || !form.due_date || !form.close_date) return;

      formData.append("title", form.title)
      formData.append("description", form.description)
      formData.append("point", String(form.point))
      formData.append("start", form.start_date.toISOString())
      formData.append("due", form.due_date.toISOString())
      formData.append("close", form.close_date.toISOString())
      formData.append("ai_agent", String(form.ai_agent))
      formData.append("assignment_prompt", String(form.assignment_prompt))
      formData.append("visible", String(form.visible))

      if (tags) {
        tags.forEach(tag => formData.append("tags", tag));
      }

      if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          if (file instanceof File) {
            formData.append("files", file);
          }
        });
      } else if (selectedAttachments && selectedAttachments.length > 0) {
        selectedAttachments.forEach((attachment) => {
          formData.append("attachments", attachment.id);
        });
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/assignments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        toast.error("Failed to create Assignment", {
          description: "Something went wrong. Please try again.",
        })
        return;
      }

      const data = await res.json()
      onCreated(data)
      setOpen(false)
      setForm(DEFAULT_FORM)
      setTags([])
      setErrors({})
      toast.success("Assignment created", {
        description: "The assignment was create successfully.",
      })
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Something went wrong" })
      toast.error("Failed to create Assignment", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setForm(DEFAULT_FORM)
      setTags([])
      setTagInput("")
      setErrors({})
      setSelectedAttachments([])
      setUploadedFiles([])
      setAttachmentTabOpen(false)
    }
  }

  const handleTest = () => {
    console.log("test")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>Add a new assignment to this course.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-12rem)] pr-4" onWheel={() => setTemplatePickerOpen(false)}>
          <div className="grid gap-5 py-2">
            {/* Template Picker */}
            <div className="grid gap-1.5">
              <Label>Use Template</Label>
              <div className="flex items-center gap-2">
                <Popover open={templatePickerOpen} onOpenChange={(v) => { setTemplatePickerOpen(v); if (v) fetchTemplates() }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <LayoutTemplate className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {selectedTemplate ? selectedTemplate.title : "Select a template..."}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[480px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search templates..."
                          value={templateSearch}
                          onChange={(e) => setTemplateSearch(e.target.value)}
                          className="h-8 pl-8 text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                    <ScrollArea className="max-h-[70vh]" style={{ height: `${templateDropdownHeight}px` }}>
                      {isLoadingTemplates ? (
                        <div className="flex items-center justify-center py-8">
                          <Spinner className="h-5 w-5" />
                        </div>
                      ) : filteredTemplates.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No templates found</p>
                      ) : (
                        <div className="p-1">
                          {filteredTemplates.map((tpl) => (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() => applyTemplate(tpl)}
                              className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${selectedTemplate?.id === tpl.id ? "bg-primary/5" : ""
                                }`}
                            >
                              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                {selectedTemplate?.id === tpl.id ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{tpl.title}</span>
                                  <span className="text-xs text-muted-foreground">{tpl.point} pts</span>
                                  {tpl.ai_agent && (
                                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">AI</Badge>
                                  )}
                                </div>
                                {tpl.tags.length > 0 ? (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {tpl.tags.slice(0, 3).map((tag) => (
                                      <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                                    ))}
                                    {tpl.tags.length > 3 && (
                                      <span className="text-[10px] text-muted-foreground">+{tpl.tags.length - 3}</span>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <span key={tpl.id + "no_tag"} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">no tags</span>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                {selectedTemplate && (
                  <Button type="button" variant="ghost" size="icon" onClick={clearTemplate} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear template</span>
                  </Button>
                )}
              </div>
              {selectedTemplate && (
                <p className="text-xs text-muted-foreground">
                  Form pre-filled from template. You can edit any field before saving.
                </p>
              )}
            </div>

            <Separator />

            {/* Title */}
            <div className="grid gap-1.5">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. HTML Basics Quiz"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <TipTapTextEditor
                value={form.description}
                onChange={(e) => set("description", e)}
                editable={true}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            {/* Points */}
            <div className="grid gap-1.5">
              <Label htmlFor="point">Points <span className="text-destructive">*</span></Label>
              <Input
                id="point"
                type="number"
                min={1}
                placeholder="100"
                value={form.point}
                onChange={(e) => set("point", Number(e.target.value))}
              />
              {errors.point && <p className="text-xs text-destructive">{errors.point}</p>}
            </div>

            {/* Tags */}
            <div className="grid gap-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  Attachments
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (optional, up to {MAX_FILES})
                  </span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {totalAttachments}/{MAX_FILES}
                </span>
              </div>

              {/* Selected summary chips */}
              {totalAttachments > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uploadedFiles.map((f, i) => (
                    <Badge key={`upload-${i}`} variant="secondary" className="gap-1 pr-1 text-xs">
                      <Upload className="h-3 w-3 shrink-0" />
                      {f.name}
                      <button onClick={() => removeUploadedFile(i)} className="ml-0.5 rounded-sm opacity-60 hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedAttachments.map((a) => (
                    <Badge key={a.id} variant="secondary" className="gap-1 pr-1 text-xs">
                      <Paperclip className="h-3 w-3 shrink-0" />
                      {a.file_name}
                      <button onClick={() => toggleExistingAttachment(a)} className="ml-0.5 rounded-sm opacity-60 hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add attachment panel */}
              {totalAttachments < MAX_FILES && (
                <div className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentTabOpen((v) => !v)
                      fetchExistingAttachments()
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Add attachment
                    </span>
                    <span className="text-xs">{attachmentTabOpen ? "Close" : "Open"}</span>
                  </button>

                  {attachmentTabOpen && (
                    <div className="border-t">
                      <Tabs defaultValue="upload" className="p-3">
                        <TabsList className="mb-3 w-full">
                          <TabsTrigger value="upload" className="flex-1 gap-1.5">
                            <Upload className="h-3.5 w-3.5" />
                            Upload New
                          </TabsTrigger>
                          <TabsTrigger value="existing" className="flex-1 gap-1.5">
                            <FolderOpen className="h-3.5 w-3.5" />
                            Select Existing
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="mt-0">
                          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/30">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Click to upload files</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Up to {MAX_FILES - totalAttachments} more file{MAX_FILES - totalAttachments !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <input
                              type="file"
                              multiple
                              className="sr-only"
                              onChange={handleUploadFiles}
                            />
                          </label>
                        </TabsContent>

                        <TabsContent value="existing" className="mt-0">
                          {isLoadingAttachments ? (
                            <div className="flex items-center justify-center py-8">
                              <Spinner className="h-5 w-5" />
                            </div>
                          ) : existingAttachments.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">No uploaded files found</p>
                          ) : (
                            <>
                              <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  placeholder="Search files..."
                                  value={attachmentSearch}
                                  onChange={(e) => setAttachmentSearch(e.target.value)}
                                  className="h-8 pl-8 text-sm"
                                />
                              </div>
                              <ScrollArea className="h-44">
                                <div className="space-y-1 pr-2">
                                  {existingAttachments
                                    .filter((a) =>
                                      a.file_name.toLowerCase().includes(attachmentSearch.toLowerCase())
                                    )
                                    .map((att) => {
                                      const Icon = getFileIcon(att.file_type)
                                      const isSelected = selectedAttachments.some((a) => a.id === att.id)
                                      const isDisabled = !isSelected && totalAttachments >= MAX_FILES
                                      return (
                                        <button
                                          key={att.id}
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => toggleExistingAttachment(att)}
                                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${isSelected
                                            ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                            : isDisabled
                                              ? "cursor-not-allowed opacity-40"
                                              : "hover:bg-muted"
                                            }`}
                                        >
                                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                          <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{att.file_name}</p>
                                            <p className="text-xs text-muted-foreground">{formatSize(att.size)}</p>
                                          </div>
                                          {isSelected && (
                                            <span className="shrink-0 text-xs font-medium text-primary">Selected</span>
                                          )}
                                        </button>
                                      )
                                    })}
                                  {existingAttachments.filter((a) =>
                                    a.file_name.toLowerCase().includes(attachmentSearch.toLowerCase())
                                  ).length === 0 && (
                                      <p className="py-4 text-center text-xs text-muted-foreground">
                                        No files match &ldquo;{attachmentSearch}&rdquo;
                                      </p>
                                    )}
                                </div>
                              </ScrollArea>
                            </>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="start_date">Start Date <span className="text-destructive">*</span></Label>
                <SmartDatetimePickerByTui
                  value={form.start_date}
                  onChange={(e) => set("start_date", e)}
                  placeholder='E.g. "tomorrow at 5pm" or "in 2 hours"'
                />
                {errors.start_date && <p className="text-xs text-destructive">{errors.start_date}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="due_date">Due Date <span className="text-destructive">*</span></Label>
                <SmartDatetimePickerByTui
                  value={form.due_date}
                  onChange={(e) => set("due_date", e)}
                  placeholder='E.g. "tomorrow at 5pm" or "in 2 hours"'
                />
                {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="close_date">Close Date <span className="text-destructive">*</span></Label>
                <SmartDatetimePickerByTui
                  value={form.close_date}
                  onChange={(e) => set("close_date", e)}
                  placeholder='E.g. "tomorrow at 5pm" or "in 2 hours"'
                />
                {errors.close_date && <p className="text-xs text-destructive">{errors.close_date}</p>}
              </div>
            </div>

            {/* AI Agent toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Visible to Students</Label>
                <p className="text-sm text-muted-foreground">
                  When off, the assignment is hidden from students until you turn this on
                </p>
              </div>
              <Switch
                checked={form.visible}
                onCheckedChange={(val) => set("visible", val)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">AI Agent</Label>
                <p className="text-sm text-muted-foreground">
                  Enable an AI agent to assist or evaluate submissions
                </p>
              </div>
              <Switch
                checked={form.ai_agent}
                onCheckedChange={(val) => set("ai_agent", val)}
              />
            </div>

            {/* AI Prompt — only shown when AI Agent is on */}
            {form.ai_agent && (
              <div className="grid gap-1.5">
                <Label htmlFor="assignment_prompt">
                  AI Prompt <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="assignment_prompt"
                  placeholder={`อธิบายงานที่ AI ต้องทำให้ชัดเจน เช่น
- ให้ตรวจอะไรบ้าง และต้องอ้างอิงเกณฑ์ไหน
- ต้องตอบเป็น paragraph, bullet points, หรือทั้งคู่
- ต้องใช้ภาษาอะไร เช่น ไทย/อังกฤษ/ผสม
- มีเกณฑ์ให้คะแนนไหม และคะแนนเต็มเท่าไร
- ต้องเน้นความถูกต้อง, ความครบถ้วน, หรือความสั้นกระชับ`}
                  rows={4}
                  value={form.assignment_prompt}
                  onChange={(e) => set("assignment_prompt", e.target.value)}
                />
                {errors.assignment_prompt && (
                  <p className="text-xs text-destructive">{errors.assignment_prompt}</p>
                )}
              </div>
            )}

            {errors.submit && (
              <p className="text-sm text-destructive">{errors.submit}</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Create Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
