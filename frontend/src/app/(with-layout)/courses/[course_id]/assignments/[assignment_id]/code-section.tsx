"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Code, Play, Upload, FileText, X, Pencil, HatGlasses, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, NotebookText } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useAuth } from "@/lib/auth-context"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Toggle } from "@/components/ui/toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CodeSectionProps {
  courseId: string
  assignmentId: string
  submissionId: string
  submissions?: { id: string; submitter: string }[]
  hasSubmission: boolean
  isAnonymous: boolean
  toggleAnonymous?: (isAnonymous: boolean) => void
  leaveEvaluate?: () => void
  onPreviousSubmission?: () => void
  onNextSubmission?: () => void
  onSelectSubmission?: (submissionId: string) => void
  canGoPrevious?: boolean
  canGoNext?: boolean
  currentSubmissionOrder?: number
  totalSubmissions?: number
  answerContent: string
  isContentLoading: boolean
  contentError: string | null
}

export function CodeSection({
  courseId,
  assignmentId,
  submissionId,
  submissions = [],
  hasSubmission,
  isAnonymous,
  toggleAnonymous,
  leaveEvaluate,
  onPreviousSubmission,
  onNextSubmission,
  onSelectSubmission,
  canGoPrevious = false,
  canGoNext = false,
  currentSubmissionOrder = 0,
  totalSubmissions = 0,
  answerContent,
  isContentLoading,
  contentError,
}: CodeSectionProps) {
  const [code, setCode] = useState("")
  const [stdin, setStdin] = useState<string>("")
  const [output, setOutput] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(14)
  const { user } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    setCode(answerContent)
  }, [answerContent])

  useEffect(() => {
    setOutput(null)
    setRunError(null)
  }, [submissionId])

  const handleCodeChange = (newCode: string | undefined) => {
    setCode(newCode ?? "")
  }

  const handleRunCode = async () => {
    if (!user) return
    console.log("tets")
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
      } else {
        console.log("222")
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

  // In evaluate mode, always show the toolbar with back button even if no submission
  if (!hasSubmission && !leaveEvaluate) {
    return (
      <p>No submission</p>
    )
  }

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b p-2 bg-muted/40">
        <Button onClick={handleRunCode}>
          <Play />
          Run code
        </Button>
        <Toggle
          pressed={isEditing}
          onPressedChange={setIsEditing}
        >
          <Pencil />
          Edit
        </Toggle>
        <Toggle
          pressed={isAnonymous}
          onPressedChange={toggleAnonymous || (() => { })}
        >
          <HatGlasses />
          Anonymous Mode
        </Toggle>
        <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(Number(value))}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="12">12px</SelectItem>
              <SelectItem value="14">14px</SelectItem>
              <SelectItem value="16">16px</SelectItem>
              <SelectItem value="18">18px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="24">24px</SelectItem>
              <SelectItem value="28">28px</SelectItem>
              <SelectItem value="32">32px</SelectItem>
              <SelectItem value="36">36px</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1">
          <Button
            onClick={onPreviousSubmission}
            variant="ghost"
            size="icon"
            disabled={!canGoPrevious}
            aria-label="Previous submission"
            className="h-8 w-8"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-14 text-center text-sm text-muted-foreground">
            {currentSubmissionOrder}/{totalSubmissions}
          </span>
          <Button
            onClick={onNextSubmission}
            variant="ghost"
            size="icon"
            disabled={!canGoNext}
            aria-label="Next submission"
            className="h-8 w-8"
          >
            <ChevronRight />
          </Button>
          <Select value={submissionId} onValueChange={onSelectSubmission}>
            <SelectTrigger className="w-32 h-8 shrink-0">
              <SelectValue placeholder={currentSubmissionOrder ? `#${currentSubmissionOrder}` : "Select"} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectGroup>
                {submissions.map((submission, index) => (
                  <SelectItem key={submission.id} value={submission.id} title={submission.id}>
                    {isAnonymous ? `#${index + 1}` : submission.submitter.split("|")[0]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            onClick={leaveEvaluate}
            variant="ghost"
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {!hasSubmission ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <span>No submission</span>
          </div>
        ) : isContentLoading ? (
          <Skeleton className="h-full" />
        ) : contentError ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NotebookText />
              </EmptyMedia>
              <EmptyTitle>Failed to load submission</EmptyTitle>
              <EmptyDescription>{contentError || "Submission not found"}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Editor
            height="100%"
            defaultLanguage={"python"}
            value={code}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            onChange={handleCodeChange}
            options={{
              readOnly: !isEditing,
              minimap: { enabled: false },
              fontSize: fontSize,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
            }}
          />
        )}
      </div>
      {hasSubmission && (
        <div className="shrink-0 rounded-md border bg-card text-card-foreground px-3 py-2 shadow-sm">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Input (stdin)</label>
          <Textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your Python code..."
            className="w-full h-20 resize-none rounded-md text-sm"
          />
          {(output !== null || runError !== null) && (
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {output !== null && (
                <div className="rounded-md border bg-muted/40 p-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Output</label>
                  <ScrollArea className="max-h-28">
                    <div className="font-mono text-xs">
                      <pre className="whitespace-pre-wrap">{output || "(no output)"}</pre>
                    </div>
                  </ScrollArea>
                </div>
              )}
              {runError !== null && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2">
                  <label className="mb-1 block text-xs font-medium text-destructive">Error</label>
                  <ScrollArea className="max-h-28">
                    <div className="font-mono text-xs text-destructive">
                      <pre className="whitespace-pre-wrap">{runError || "(unknown error)"}</pre>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
