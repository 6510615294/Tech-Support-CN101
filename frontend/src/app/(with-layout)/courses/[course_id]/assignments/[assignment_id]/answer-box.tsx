"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Code, Play, Upload, FileText, X, NotebookText } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"

interface AnswerBoxProps {
  courseId: string
  assignmentId: string
  submissionId: string
  attachmentId?: string
  fileName?: string
  isStudent: boolean
  hasSubmission: boolean
  onRunCode?: (code: string) => Promise<string>
  onSubmit?: (file?: File | null) => void
  answerContent: string
  isContentLoading: boolean
  contentError: string | null
}

export function AnswerBox({
  courseId,
  assignmentId,
  submissionId,
  attachmentId,
  fileName,
  isStudent,
  hasSubmission,
  onRunCode,
  onSubmit,
  answerContent,
  isContentLoading,
  contentError,
}: AnswerBoxProps) {
  const [code, setCode] = useState("")
  const [stdin, setStdin] = useState<string>("")
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [shouldRemoveFile, setShouldRemoveFile] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setCode(answerContent)
  }, [answerContent])

  useEffect(() => {
    setOutput(null)
    setRunError(null)
  }, [submissionId])

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
  }

  const handleRunCode = async () => {
    if (!onRunCode || !user) return
    setIsRunning(true)
    setOutput(null)
    setRunError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/run/python3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          source_code: code,
          stdin: stdin,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to run code")
      }

      const result = await response.json()
      setOutput(result.stdout || result.output || "")
      if (result.stderr) {
        setRunError(result.stderr)
      }
    } catch (error) {
      setRunError(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleSubmit = async () => {
    if (!onSubmit) return
    setIsSubmitting(true)
    try {
      if (shouldRemoveFile) {
        await onSubmit(null)
      } else if (selectedFile) {
        await onSubmit(selectedFile)
      }
      // Reset state after successful submission
      setIsEditing(false)
      setSelectedFile(null)
      setShouldRemoveFile(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Student view - no submission yet
  if (isStudent && !hasSubmission) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4" />
            Submit Answer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Attach File</label>
            {selectedFile ? (
              <div className="flex items-center gap-2 rounded-md border p-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-dashed p-6">
                <label className="flex cursor-pointer flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload file</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={!selectedFile || isSubmitting} className="w-full">
            {isSubmitting ? <Spinner className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
            Submit
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (contentError) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Answer
            </span>
            <div
              className="flex items-center gap-1 text-sm font-normal"
            >
              --
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NotebookText/>
              </EmptyMedia>
              <EmptyTitle>Failed to load submission</EmptyTitle>
              <EmptyDescription>{contentError || "Submission not found"}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  // Student view - has submission (read-only or edit mode)
  if (isStudent && hasSubmission) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Your Answer
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Submitted</Badge>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            // Edit mode
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Update File</label>
                {selectedFile ? (
                  <div className="flex items-center gap-2 rounded-md border p-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : shouldRemoveFile ? (
                  <div className="flex items-center justify-center rounded-md border border-dashed p-6">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm text-muted-foreground">No Submission File</span>
                    </div>
                  </div>
                ) : attachmentId && fileName ? (
                  <div className="flex items-center gap-2 rounded-md border p-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{fileName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShouldRemoveFile(true)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-md border border-dashed p-6">
                    <label className="flex cursor-pointer flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload new file</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!selectedFile && !shouldRemoveFile)}
                  className="flex-1"
                >
                  {isSubmitting ? <Spinner className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                  Update
                </Button>
                <Button variant="outline" asChild>
                  <label htmlFor="edit-file-input" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Browse
                  </label>
                </Button>
                <input
                  id="edit-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setSelectedFile(null)
                    setShouldRemoveFile(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View mode
            <>
              {attachmentId && fileName && (
                <div className="flex items-center gap-2 rounded-md border p-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {fileName}
                </div>
              )}
              {isContentLoading ? (
                <div>
                  <Skeleton className="h-64" />
                </div>
              ) : (
                <ScrollArea className="h-64 rounded-md bg-muted">
                  <div className="p-4 font-mono text-sm">
                    <pre className="whitespace-pre-wrap wrap-break-word overflow-hidden">{code}</pre>
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Non-student view - editable code with run button
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Answer
          </span>
          {attachmentId && fileName && (
            <div
              className="flex items-center gap-1 text-sm font-normal"
            >
              <FileText className="h-4 w-4" />
              {fileName}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isContentLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <Textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="font-mono text-sm min-h-[200px]"
            placeholder="Code answer..."
          />
        )}
        <Textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Enter input for your Python code..."
          className="w-full rounded-sm border p-2 text-sm min-h-16"
        />
        <div className="flex gap-2">
          <Button onClick={handleRunCode} disabled={isRunning} variant="outline">
            {isRunning ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
            Run Code
          </Button>
        </div>
        {output !== null && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Output</label>
            <ScrollArea className="h-64 rounded-md bg-muted">
              <div className="p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap wrap-break-word overflow-hidden">{output || "(no output)"}</pre>
              </div>
            </ScrollArea>
          </div>
        )}
        {runError !== null && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Error</label>
            <ScrollArea className="h-64 rounded-md bg-muted">
              <div className="p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap wrap-break-word overflow-hidden">{runError || "(unknown error)"}</pre>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
