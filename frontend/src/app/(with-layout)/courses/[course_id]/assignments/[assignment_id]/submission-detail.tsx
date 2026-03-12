"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import CodeEditor from "./code-editor"

type Submission = {
  id: string
  answer: string
  point: number
  graded_by: string
  attachment_id: string
  file_name: string
  comments: Comment[]
}

type Comment = {
  id: string
  comment: string
  commentator: string
  visible: boolean
}

type SubmissionDetailProps = {
  submission: Submission | null
  role: string
  maxPoint: number
  isAnonymous: boolean
  onSave?: (grade: number, comment: string, isVisible: boolean) => void
  toggleComment?: (commentId: string) => void
}

const hidePythonComments = (code: string): string => {
  let result = code
  
  // Remove triple-quoted comments ("""...""" or '''...''')
  result = result.replace(/"""[\s\S]*?"""/g, '')
  result = result.replace(/'''[\s\S]*?'''/g, '')
  
  // Remove single-line comments (starting with #) - but careful not to remove # in strings
  // This regex matches # followed by anything until end of line, but not if preceded by a quote (basic heuristic)
  const lines = result.split('\n')
  const filteredLines = lines.map(line => {
    // Find positions of string delimiters
    const singleQuotePositions = []
    const doubleQuotePositions = []
    for (let i = 0; i < line.length; i++) {
      if (line[i] === "'" && (i === 0 || line[i-1] !== '\\')) {
        singleQuotePositions.push(i)
      }
      if (line[i] === '"' && (i === 0 || line[i-1] !== '\\')) {
        doubleQuotePositions.push(i)
      }
    }
    
    // Find comment position
    const commentIndex = line.indexOf('#')
    if (commentIndex === -1) {
      return line
    }
    
    // Check if # is inside a string
    let inSingleQuote = false
    let inDoubleQuote = false
    for (let i = 0; i < commentIndex; i++) {
      if (line[i] === "'" && (i === 0 || line[i-1] !== '\\')) {
        inSingleQuote = !inSingleQuote
      }
      if (line[i] === '"' && (i === 0 || line[i-1] !== '\\')) {
        inDoubleQuote = !inDoubleQuote
      }
    }
    
    if (inSingleQuote || inDoubleQuote) {
      return line // # is inside a string, don't remove
    }
    
    return line.substring(0, commentIndex)
  })
  
  return filteredLines.join('\n')
}

export function SubmissionDetail({
  submission,
  role,
  maxPoint,
  isAnonymous,
  onSave,
  toggleComment,
}: SubmissionDetailProps) {
  const existingComment = submission?.comments.find(c => c.commentator === role)
  const [grade, setGrade] = useState(submission?.point || 0)
  const [newComment, setNewComment] = useState(existingComment?.comment || "")
  const [isVisible, setIsVisible] = useState(existingComment?.visible ?? true)
  const [answerContent, setAnswerContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionOutput, setExecutionOutput] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [stdin, setStdin] = useState<string>("")
  
  useEffect(() => {
    if (!submission?.id) return
    
    const fetchAnswerContent = async () => {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/submission/${submission.id}`,
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
        setAnswerContent(content)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAnswerContent()
  }, [submission?.id])

  const executeCode = async () => {
    setIsExecuting(true)
    setExecutionError(null)
    const token = localStorage.getItem("token")

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/run/python3`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source_code: answerContent,
          stdin: stdin,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute code")
      }

      const result = await response.json()
      setExecutionOutput(result.stdout || result.output || "")
      if (result.stderr) {
        setExecutionError(result.stderr)
      }
    } catch (err) {
      setExecutionError(err instanceof Error ? err.message : "An error occurred during execution")
    } finally {
      setIsExecuting(false)
    }
  }

  if (!submission) {
    return (
      <div className="p-5 text-gray-500">
        Select a submission to view details
      </div>
    )
  }

  return (
    <div className="space-y-4 p-5">
      {/* Answer Area */}
      <div className="rounded-sm border bg-gray-900 text-sm h-[33vh]">
        {isLoading ? (
          <code>Loading answer content...</code>
        ) : error ? (
          <code className="text-red-500">Error: {error}</code>
        ) : (
          <CodeEditor 
            value={isAnonymous ? hidePythonComments(answerContent) : answerContent}
            readOnly={false}
            onChange={setAnswerContent}
            className="rounded-sm"
          />
        )}
      </div>

      {/* Run Code Button and Output */}
      {role != "student" && (
      <div className="space-y-2">
        {/* Stdin Input Area */}
        <div>
          <label className="block text-sm font-medium mb-1">Stdin (Input for Python code)</label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your Python code..."
            className="w-full rounded-sm border p-2 text-sm min-h-16 bg-gray-900"
          />
        </div>
        <button
          onClick={executeCode}
          disabled={!answerContent || isLoading || isExecuting}
          className={`rounded-sm px-4 py-2 text-sm text-black ${
            !answerContent || isLoading || isExecuting
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isExecuting ? "Running..." : "Run Python Code"}
        </button>

        {executionOutput && (
          <div className="rounded-sm border bg-gray-900 p-4 text-sm">
            <h4 className="font-semibold mb-2">Execution Output:</h4>
            <pre className="overflow-auto max-h-[20vh]">
              <code className="text-green-400">{executionOutput}</code>
            </pre>
          </div>
        )}

        {executionError && (
          <div className="rounded-sm border border-red-500 bg-gray-900 p-4 text-sm">
            <h4 className="font-semibold mb-2 text-red-500">Execution Error:</h4>
            <pre className="overflow-auto max-h-[20vh]">
              <code className="text-red-500">{executionError}</code>
            </pre>
          </div>
        )}
      </div>
      )}

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="font-semibold">Comments</h3>

        {submission.comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet</p>
        ) : (
          submission.comments
            .filter((c) =>
              role === "student"
                ? c.visible && c.commentator !== role
                : c.commentator !== role
            )
            .map((c) => (
              <div
                key={c.id}
                onClick={() =>
                  role !== "student" && toggleComment?.(c.id)
                }
                className={`relative rounded-md border p-3 text-sm transition-colors bg-gray-900 ${
                  role !== "student"
                    ? "border-gray-500 hover:bg-gray-500 cursor-pointer"
                    : "border-gray-500"
                }`}
              >
                {role !== "student" && (
                  <div className="absolute top-2 right-2">
                    {c.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </div>
                )}
          
                <div className="font-medium pr-6">{c.commentator}</div>
                <div className="mt-1">{c.comment}</div>
              </div>
          ))
        )}
      </div>

      {/* Comment Box (only if > 1 submission) */}
      {role != "student" && onSave && (
        <div className="space-y-4 p-4 rounded-md border bg-gray-900">
          <div>
            <label className="block text-sm font-medium mb-1">Grade</label>
            <input
              type="number"
              min={0}
              max={maxPoint}
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              placeholder="Enter grade..."
              className="w-full rounded-md border p-2 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Comment</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full rounded-md border p-2 text-sm min-h-24"
            />
          </div>
      
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className={`rounded-md px-4 py-2 text-sm ${
                isVisible 
                  ? "bg-green-600 text-black" 
                  : "bg-gray-400 text-black"
              }`}
            >
              {isVisible ? "Visible" : "Hidden"}
            </button>
            <button
              onClick={() => {
                onSave(grade, newComment, isVisible)
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-black"
            >
              Save Grade&Comment
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
