"use client"

import { useEffect, useRef, useState } from "react"
import { z } from "zod"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card"
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
import { BreadcrumbNav } from "@/components/breadcrumb-nav"
import {
  Upload,
  Search,
  Download,
  Trash2,
  File as FileIcon,
  AlertCircle
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from "@/components/ui/empty"
import { getFileIcon, getMimeBadge } from "@/lib/file"
import { toast } from "sonner"

type Attachment = {
  id: string
  file_name: string
  file_type: string
  size: number
  created_at: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const fileUploadSchema = z.object({
  files: z.array(
    z.instanceof(File).refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "Each file must be less than 10MB"
    )
  ).min(1, "At least one file is required")
    .max(5, "Maximum 5 files allowed")
})

export default function AttachmentsPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)

  useEffect(() => {
    if (!user?.token) return
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        if (!res.ok) {
          throw new Error("Failed to fetch attachments")
        }
        const data = await res.json()
        setAttachments(data ?? [])
      } catch(err) {
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        })
        setError(err instanceof Error ? err.message : "Failed to load attachments")
        setAttachments([])
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user])

  const filtered = attachments.filter((a) =>
    a.file_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!user || !files || files.length === 0) return

    // Validate files with Zod
    const validationResult = fileUploadSchema.safeParse({ files: Array.from(files) })
    if (!validationResult.success) {
      const error = validationResult.error
      toast.error("Failed to upload File", {
        description: error.message,
      })
      e.target.value = ""
      return
    }

    setUploading(true)
    try {
      // Create FormData with the key "files" as required by backend
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append("files", file)
      })

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        toast.error(`Failed to upload Attachment${files.length > 1 ? "s" : ""}`, {
          description: "Something went wrong. Please try again.",
        })
        return
      }

      // Reload attachments after successful upload
      const reloadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await reloadRes.json()
      setAttachments(data ?? [])
      
      toast.success(`Attachment${files.length > 1 ? "s" : ""} Uploaded`, {
        description: `The attachment${files.length > 1 ? "s" : ""} was uploaded successfully.`,
      })
    } catch (err) {
      console.error(err)
      toast.error(`Failed to upload Attachment${files.length > 1 ? "s" : ""}`, {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }
  
  // add downloading state or no
  const handleDownload = async (attachment: Attachment) => {
    if (!user) return
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments/${attachment.id}/download`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      
      if (!res.ok) { 
        toast.error("Download failed", {
          description: "Something went wrong. Please try again.",
        })
        return
      } 
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error(err)
      toast.error("Download failed", {
        description: "Something went wrong. Please try again.",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attachments/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      
      if (!res.ok) {
        toast.error("Failed to delete Attachment", {
          description: "Something went wrong. Please try again.",
        })
        return;
      }
      
      setAttachments((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      toast.success("Attachment deleted", {
        description: "The attachment was deleted successfully.",
      })
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete Attachment", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col min-h-svh">
      <BreadcrumbNav />

      <div className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Attachments</h1>
            </div>
            <p className="mt-1 text-muted-foreground">
              Upload, download, and manage files for assignments and templates.
            </p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex-row items-center gap-3 pb-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-3 w-9 rounded-md" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
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

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && !error && (
          <Empty className="py-20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileIcon className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>No attachments found</EmptyTitle>
              <EmptyDescription>
                {search ? "Try a different search term." : "Upload your first file to get started."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {/* Attachment Grid */}
        {!isLoading && filtered.length > 0 && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((attachment) => (
              <Card key={attachment.id} className="flex flex-col">
                <CardHeader className="flex-row items-start gap-3 pb-2">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                    {getFileIcon(attachment.file_type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="truncate text-sm font-semibold leading-snug">
                      {attachment.file_name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {formatBytes(attachment.size)}
                    </CardDescription>
                  </div>
                  <CardAction>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {getMimeBadge(attachment.file_type)}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>{formatDate(attachment.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setDeleteTarget(attachment)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{deleteTarget?.file_name}</span> will be permanently
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
    </div>
  )
}
