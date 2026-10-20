"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { UserPlus, X, ClipboardList, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ROLES = ["teacher", "ta", "student"] as const
type Role = (typeof ROLES)[number]

const ROLE_CONFIG: Record<Role, { label: string; badge: string }> = {
  teacher: {
    label: "Teacher",
    badge: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-400",
  },
  ta: {
    label: "TA",
    badge: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 dark:text-amber-400",
  },
  student: {
    label: "Student",
    badge: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800 dark:text-green-400",
  },
}

interface UserEntry {
  username: string
  course_role: Role
}

interface EnrollResult {
  username: string
  role: Role
  status: string
}

function parseInput(raw: string): UserEntry[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const csvMatch = line.match(/^([^,]+),\s*(\S+)$/)
      if (csvMatch) {
        const username = csvMatch[1].trim()
        const role = csvMatch[2].trim().toLowerCase() as Role
        return { username, course_role: ROLES.includes(role) ? role : "student" }
      }
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        const role = parts[parts.length - 1].toLowerCase() as Role
        if (ROLES.includes(role)) {
          return { username: parts.slice(0, -1).join(" "), course_role: role }
        }
      }
      return { username: line, course_role: "student" as Role }
    })
}

interface EnrollDialogProps {
  courseId: string
  onEnrolled?: (entries: UserEntry[]) => void
}

export function EnrollDialog({ courseId, onEnrolled }: EnrollDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [username, setUsername] = useState("")
  const [role, setRole] = useState<Role>("student")
  const [entries, setEntries] = useState<UserEntry[]>([])
  const [bulkText, setBulkText] = useState("")
  const [bulkMode, setBulkMode] = useState(false)
  const [inputError, setInputError] = useState(false)
  const bulkRef = useRef<HTMLTextAreaElement>(null)
  const [enrollResult, setEnrollResult] = useState<EnrollResult[]>([])

  const addSingle = () => {
    const u = username.trim()
    if (!u) {
      setInputError(true)
      setTimeout(() => setInputError(false), 600)
      return
    }
  
    setEntries((prev) => {
      const exists = prev.some(e => e.username === u)
      if (exists) {
        setInputError(true)
        setTimeout(() => setInputError(false), 600)
        return prev
      }
  
      return [...prev, { username: u, course_role: role }]
    })
  
    setUsername("")
    setRole("student")
  }

  const parseBulk = () => {
    const parsed = parseInput(bulkText)
    if (!parsed.length) return
  
    setEntries((prev) => {
      const existingUsernames = new Set(prev.map(e => e.username))
  
      const uniqueParsed = parsed.filter((entry, index, arr) => {
        const isDuplicateInParsed =
          arr.findIndex(e => e.username === entry.username) !== index
  
        const alreadyExists = existingUsernames.has(entry.username)
  
        return !isDuplicateInParsed && !alreadyExists
      })
  
      return [...prev, ...uniqueParsed]
    })
  
    setBulkText("")
    setBulkMode(false)
  }

  const removeEntry = (i: number) =>
    setEntries((prev) => prev.filter((_, idx) => idx !== i))

  const updateRole = (i: number, newRole: Role) =>
    setEntries((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, course_role: newRole } : e))
    )

  const handleSubmit = async () => {
    if (!entries.length || !user) return
    setIsSubmitting(true)
    console.log(entries)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          "user_enroll": entries
        }),
      })
      
      if (!res.ok) {
        toast.error("Failed to enroll user", {
          description: "Something went wrong. Please try again.",
        })
        return;
      }
      
      const data = await res.json()
      
      toast.success("Enroll completed", {
        description: "The users was enrolled successfully.",
      })
      
      onEnrolled?.(data.enrollment_result)
      setEnrollResult(data.enrollment_result)
      setEntries([])
      setBulkText("")
      setBulkMode(false)
    } catch(err) {
      console.error(err)
      toast.error("Failed to enroll users", {
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (!val) {
      setUsername("")
      setRole("student")
      setBulkText("")
      setBulkMode(false)
      setInputError(false)
      setEnrollResult([])
    }
  }

  const countByRole = (r: Role) => entries.filter((e) => e.course_role === r).length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Members
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            Enroll Members
          </DialogTitle>
          <DialogDescription>
            Add users individually or paste a list. Roles can be changed before submitting.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Single Entry Row */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Add single user</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSingle()}
                className={cn(
                  "flex-1 transition-colors",
                  inputError && "border-destructive ring-1 ring-destructive"
                )}
              />
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={addSingle} disabled={isSubmitting}>
                Add
              </Button>
            </div>
          </div>

          {/* Bulk Toggle */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={() => {
                setBulkMode((b) => !b)
                setTimeout(() => bulkRef.current?.focus(), 50)
              }}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {bulkMode ? "Close bulk" : "Bulk paste"}
            </Button>
            <Separator className="flex-1" />
          </div>

          {/* Bulk Input */}
          {bulkMode && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                One entry per line. Format:{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">username role</code>{" "}
                or{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">username,role</code>.
                No role defaults to student.
              </p>
              <Textarea
                ref={bulkRef}
                placeholder={"8810615201 teacher\n8810615202 ta\n8810615203, student\n8810615204"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={parseBulk} disabled={!bulkText.trim() || isSubmitting}>
                  Parse & Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setBulkMode(false); setBulkText("") }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Entry List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Users to enroll
                {entries.length > 0 && (
                  <span className="ml-2 tabular-nums text-muted-foreground">({entries.length})</span>
                )}
              </p>
              {entries.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {ROLES.filter((r) => countByRole(r) > 0).map((r) => (
                    <Badge
                      key={r}
                      variant="outline"
                      className={cn("text-xs", ROLE_CONFIG[r].badge)}
                    >
                      {countByRole(r)} {ROLE_CONFIG[r].label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 py-10 text-center">
                <UserCheck className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No users added yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Add users above or use bulk paste
                </p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y overflow-hidden">
                {entries.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-background px-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {entry.username[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="flex-1 truncate font-mono text-sm">{entry.username}</span>
                    <Select
                      value={entry.course_role}
                      onValueChange={(v) => updateRole(i, v as Role)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-7 w-24 border text-xs font-medium",
                          ROLE_CONFIG[entry.course_role].badge
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_CONFIG[r].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeEntry(i)}
                      disabled={isSubmitting}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrollment Results */}
          {enrollResult.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Enrollment Results</p>
                <Badge variant="outline" className="text-xs">
                  {enrollResult.length} {enrollResult.length === 1 ? "result" : "results"}
                </Badge>
              </div>
              <div className="rounded-lg border divide-y overflow-hidden">
                {enrollResult.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-background px-3 py-2.5 transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {result.username[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="flex-1 truncate font-mono text-sm">{result.username}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", ROLE_CONFIG[result.role].badge)}
                    >
                      {ROLE_CONFIG[result.role].label}
                    </Badge>
                    <Badge
                      variant={result.status === "success" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <DialogFooter className="px-6 py-4">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={entries.length === 0 || isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              <><Spinner className="mr-2 h-4 w-4" />Enrolling...</>
            ) : (
              `Enroll ${entries.length > 0 ? `${entries.length} user${entries.length > 1 ? "s" : ""}` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
