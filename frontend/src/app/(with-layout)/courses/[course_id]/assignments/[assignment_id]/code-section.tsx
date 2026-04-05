"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Code, Play, Upload, FileText, X, Pencil, HatGlasses } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useAuth } from "@/lib/auth-context"
import Editor from "@monaco-editor/react"
import { Toggle } from "@/components/ui/toggle"

interface CodeSectionProps {
  courseId: string
  assignmentId: string
  submissionId: string
  hasSubmission: boolean
  isAnonymous: boolean
  toggleAnonymous?: (isAnonymous: boolean) => void
  leaveEvaluate?: () => void
}

export function CodeSection({
  courseId,
  assignmentId,
  submissionId,
  hasSubmission,
  isAnonymous,
  toggleAnonymous,
  leaveEvaluate,
}: CodeSectionProps) {
  const [code, setCode] = useState("")
  const [stdin, setStdin] = useState<string>("")
  const [output, setOutput] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
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

  // Student view - no submission yet
  if (!hasSubmission) {
    return (
      <p>No submission</p>
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b p-2 bg-muted/40">
        <Button
          onClick={handleRunCode}
        >
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
          onPressedChange={toggleAnonymous || (() => {})}
        >
          <HatGlasses />
          Anonymous Mode
        </Toggle>
        <Button
          onClick={leaveEvaluate}
          variant="ghost"
        >
          <X />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
      {isLoading ? (
        <Skeleton className="h-full"/>
      ) : (
        <Editor
          height="100%"
          defaultLanguage={"python"}
          value={code}
          theme={"vs-dark"}
          onChange={handleCodeChange}
          options={{
            readOnly: !isEditing,
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
          }}
        />
      )}
      </div>
      <Textarea
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder="Enter input for your Python code..."
        className="w-full rounded-sm border p-2 text-sm min-h-30 bg-gray-900"
      />
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
    </div>
  )
}
