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
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paperclip, Upload, FolderOpen, FileText, File, Search, X } from "lucide-react"
import { TipTapTextEditor } from "./ui/tiptap"
import { toast } from "sonner"

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

type AssignmentTemplateForm = {
  title: string
  description: string
  point: number
  ai_agent: boolean
  assignment_prompt: string
}

interface EditTemplateDialogProps {
  template: AssignmentTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (template: AssignmentTemplate) => void
}

export function EditTemplateDialog({ template, open, onOpenChange, onUpdated }: EditTemplateDialogProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<AssignmentTemplateForm>({
    title: template.title,
    description: template.description,
    point: template.point,
    ai_agent: template.ai_agent,
    assignment_prompt: template.assignment_prompt,
  })
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(template.tags)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Attachments
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>(template.attachments)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [attachmentTabOpen, setAttachmentTabOpen] = useState(false)
  const [attachmentSearch, setAttachmentSearch] = useState("")

  const MAX_FILES = 5
  const totalAttachments = selectedAttachments.length + uploadedFiles.length

  // Sync form when template prop changes
  useEffect(() => {
    setForm({
      title: template.title,
      description: template.description,
      point: template.point,
      ai_agent: template.ai_agent,
      assignment_prompt: template.assignment_prompt,
    })
    setTags(template.tags)
    setSelectedAttachments(template.attachments)
    setError("")
    setErrors({})
    setUploadedFiles([])
    setAttachmentTabOpen(false)
  }, [template])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (mime: string) => {
    if (mime.includes("pdf") || mime.includes("word")) return FileText
    return File
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
    if (form.ai_agent && !form.assignment_prompt.trim())
      e.assignment_prompt = "Prompt is required when AI Agent is enabled"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      
      formData.append("title", form.title)
      formData.append("description", form.description)
      formData.append("point", String(form.point))
      formData.append("ai_agent", String(form.ai_agent))
      formData.append("assignment_prompt", form.assignment_prompt)

      tags.forEach(tag => formData.append("tags", tag))
      
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          if (file instanceof File) {
            formData.append("files", file)
          }
        })
      }
      
      if (selectedAttachments.length > 0) {
        selectedAttachments.forEach((attachment) => {
          formData.append("attachments", attachment.id)
        })
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${template.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      })
      
      if (!res.ok) {
        throw new Error("Failed to update template")
      }
      
      const data = await res.json()
      onUpdated(data)
      onOpenChange(false)
      toast.success("Template updated", {
        description: "The template was updated successfully.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      toast.error("Failed to update template", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Assignment Template</DialogTitle>
          <DialogDescription>
            Update the template details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Title */}
          <Field>
            <FieldLabel htmlFor="title">
              Title <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="title"
              name="title"
              placeholder="e.g. HTML Basics Quiz"
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </Field>

          {/* Description */}
          <Field>
            <FieldLabel htmlFor="description">
              Description <span className="text-destructive">*</span>
            </FieldLabel>
            <TipTapTextEditor
              value={form.description}
              onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
              editable={true}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </Field>

          {/* Points */}
          <Field>
            <FieldLabel htmlFor="point">
              Points <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="point"
              name="point"
              type="number"
              min={1}
              placeholder="100"
              value={form.point}
              onChange={(e) => setForm((prev) => ({ ...prev, point: Number(e.target.value) }))}
            />
            {errors.point && <p className="text-xs text-destructive">{errors.point}</p>}
          </Field>

          {/* Tags */}
          <Field>
            <FieldLabel>Tags</FieldLabel>
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
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </Field>

          {/* Attachments */}
          <Field>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>
                Attachments
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (optional, up to {MAX_FILES})
                </span>
              </FieldLabel>
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
                    <button 
                      type="button"
                      onClick={() => removeUploadedFile(i)} 
                      className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedAttachments.map((a) => (
                  <Badge key={a.id} variant="secondary" className="gap-1 pr-1 text-xs">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    {a.file_name}
                    <button 
                      type="button"
                      onClick={() => toggleExistingAttachment(a)} 
                      className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                    >
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
                                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                        isSelected
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
          </Field>

          {/* AI Agent toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FieldLabel className="text-base">AI Agent</FieldLabel>
              <p className="text-sm text-muted-foreground">
                Enable an AI agent to assist or evaluate submissions
              </p>
            </div>
            <Switch
              checked={form.ai_agent}
              onCheckedChange={(val) => setForm((prev) => ({ ...prev, ai_agent: val }))}
            />
          </div>

          {/* AI Prompt — only shown when AI Agent is on */}
          {form.ai_agent && (
            <Field>
              <FieldLabel htmlFor="assignment_prompt">
                AI Prompt <span className="text-destructive">*</span>
              </FieldLabel>
              <Textarea
                id="assignment_prompt"
                name="assignment_prompt"
                placeholder="Describe what the AI should do with student submissions..."
                rows={4}
                value={form.assignment_prompt}
                onChange={handleChange}
              />
              {errors.assignment_prompt && (
                <p className="text-xs text-destructive">{errors.assignment_prompt}</p>
              )}
            </Field>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
