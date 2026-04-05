"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Code, Play, Upload, FileText, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
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
  onSubmit?: (answer: string, file?: File) => void
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
}: AnswerBoxProps) {
  const [code, setCode] = useState("")
  const [stdin, setStdin] = useState<string>("")
  const [output, setOutput] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  useEffect(() => {
    const resetRunCode = async () => {
      setOutput(null)
      setRunError(null)
    }
    const fetchAnswerContent = async () => {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/read`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error("Failed to fetch answer content")
        }
        
        const content = await response.json()
        setCode(content)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }
    
    resetRunCode()
    fetchAnswerContent()
  }, [courseId, assignmentId, submissionId])

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
      await onSubmit(code, selectedFile || undefined)
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

  if (error) {
    return (
      <div className="p-6">
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              
            </EmptyMedia>
            <EmptyTitle>Failed to load assignment</EmptyTitle>
            <EmptyDescription>{error || "Assignment not found"}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  // Student view - has submission (read-only)
  if (isStudent && hasSubmission) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Your Answer
            </span>
            <Badge variant="outline">Submitted</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {attachmentId && fileName && (
            <div className="flex items-center gap-2 rounded-md border p-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <a
                href={`/api/attachments/${attachmentId}`}
                className="text-sm hover:underline"
              >
                {fileName}
              </a>
            </div>
          )}
          {isLoading ? (
            <div>
              <Skeleton className="h-48" />
            </div>
          ) : (
            <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">{code}</pre>
            </div>
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
            <a
              href={`/api/attachments/${attachmentId}`}
              className="flex items-center gap-1 text-sm font-normal hover:underline"
            >
              <FileText className="h-4 w-4" />
              {fileName}
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48"/>
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
          className="w-full rounded-sm border p-2 text-sm min-h-16 bg-gray-900"
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
            <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">{output || "(no output)"}</pre>
            </div>
          </div>
        )}
        {runError !== null && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Error</label>
            <div className="rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">{runError || "(unknown error)"}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
