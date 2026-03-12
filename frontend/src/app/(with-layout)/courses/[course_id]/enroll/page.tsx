"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLES = ["teacher", "ta", "student"];

const ROLE_STYLES = {
  teacher: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  ta: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  student: {
    bg: "bg-green-50 dark:bg-green-950/20",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
};

function parseInput(raw: string) {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    // Try CSV: "username,role"
    const csvMatch = line.match(/^([^,]+),\s*(\S+)$/);
    if (csvMatch) {
      const username = csvMatch[1].trim();
      const role = csvMatch[2].trim().toLowerCase();
      return { username, role: ROLES.includes(role) ? role : "student" };
    }
    // Try space-separated: "username role"
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const role = parts[parts.length - 1].toLowerCase();
      if (ROLES.includes(role)) {
        return { username: parts.slice(0, -1).join(" "), role };
      }
    }
    // Only username, default to student
    return { username: line, role: "student" };
  });
}

function RoleBadge({ role }: { role: string }) {
  const styles = ROLE_STYLES[role as keyof typeof ROLE_STYLES];
  return (
    <Badge
      className={`${styles.bg} ${styles.border} ${styles.text} gap-2 font-mono`}
      variant="outline"
    >
      <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
      {role}
    </Badge>
  );
}

interface UserEntry {
  username: string;
  role: string;
}

export default function Page({
  params,
}: {
  params: { course_id: string };
}) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("student");
  const [entries, setEntries] = useState<UserEntry[]>([]);
  const [bulkText, setBulkText] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);
  const bulkRef = useRef<HTMLTextAreaElement>(null);

  const addSingle = () => {
    const u = username.trim();
    if (!u) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setEntries((prev) => [...prev, { username: u, role }]);
    setUsername("");
    setRole("student");
    setSubmitted(false);
  };

  const parseBulk = () => {
    const parsed = parseInput(bulkText);
    if (!parsed.length) return;
    setEntries((prev) => [...prev, ...parsed]);
    setBulkText("");
    setBulkMode(false);
    setSubmitted(false);
  };

  const removeEntry = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i));

  const updateRole = (i: number, newRole: string) => {
    setEntries((prev) => prev.map((e, idx) => (idx === i ? { ...e, role: newRole } : e)));
  };

  const handleSubmit = () => {
    if (!entries.length) return;
    console.log(entries);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Course Enrollment</h1>
          <p className="text-muted-foreground mt-2">
            Enroll users into the course by adding them individually or in bulk
          </p>
        </div>
        <Card className="max-w-2xl shadow-2xl">
          <CardHeader>
            <div className="text-xs font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400">
              Roster Builder
            </div>
            <CardTitle className="text-2xl">Add Users & Roles</CardTitle>
            <CardDescription>
              Enroll users into the course by adding them individually or in bulk
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Single entry */}
            <div>
              <Label htmlFor="username">Add single user</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSingle()}
                  className={shake ? "animate-shake" : ""}
                />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addSingle}>Add</Button>
              </div>
            </div>

            {/* Bulk toggle */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBulkMode((b) => !b);
                  setTimeout(() => bulkRef.current?.focus(), 50);
                }}
              >
                {bulkMode ? "✕ Close bulk" : "⊞ Paste bulk"}
              </Button>
              {!bulkMode && (
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  space or CSV: <code>user1 teacher</code> or <code>user2,ta</code>
                </span>
              )}
            </div>

            {/* Bulk input */}
            {bulkMode && (
              <div className="space-y-2">
                <Textarea
                  ref={bulkRef}
                  placeholder="username1 teacher&#10;username2 ta&#10;username3,student&#10;username4"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground font-mono">
                  Supported: <code>username role</code> (space) or <code>username,role</code> (CSV) · no role = student
                </p>
                <div className="flex gap-2">
                  <Button onClick={parseBulk} className="flex-1">
                    Parse & Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkMode(false);
                      setBulkText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Entry list */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Users</Label>
                {entries.length > 0 && (
                  <Badge className="h-5 min-w-[20px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-mono">
                    {entries.length}
                  </Badge>
                )}
              </div>

              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm font-mono">
                  No users yet — add some above ↑
                </div>
              ) : (
                <div className="space-y-1">
                  {entries.map((e, i) => {
                    const styles = ROLE_STYLES[e.role as keyof typeof ROLE_STYLES];
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border bg-background p-2.5 animate-fade-in dark:bg-zinc-900/50"
                      >
                        <span className="flex-1 font-mono text-sm">{e.username}</span>
                        <Select value={e.role} onValueChange={(newRole) => updateRole(i, newRole)}>
                          <SelectTrigger className={`h-8 w-24 text-xs font-semibold ${styles.bg} ${styles.border} ${styles.text}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeEntry(i)}
                        >
                          ×
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={entries.length === 0}
            >
              {submitted
                ? "✓ Logged to Console!"
                : `Submit ${entries.length > 0 ? `(${entries.length} user${entries.length > 1 ? "s" : ""})` : ""}`}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.3s ease;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease;
        }
      `}</style>
    </>
  );
}