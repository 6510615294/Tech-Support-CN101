"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

// ─── Type definitions ───────────────────────────────────────────────────────────

type JobStatus = "pending" | "processing" | "completed" | "failed";

interface Job {
  id: string;
  course_id: string;
  assignment_id: string;
  assignment_title: string;
  status: JobStatus;
  progress: number;
  processed_submissions: number;
  total_submissions: number;
  error?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ClipboardList,
  CornerUpLeft,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<JobStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  progressClass: string;
  valueClass: string;
  cardBorder: string;
  spinIcon: boolean;
}> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    progressClass: "[&>div]:bg-amber-400",
    valueClass: "text-amber-400",
    cardBorder: "border-amber-500/20",
    spinIcon: false,
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "border-sky-500/40 text-sky-400 bg-sky-500/10",
    progressClass: "[&>div]:bg-sky-400",
    valueClass: "text-sky-400",
    cardBorder: "border-sky-500/20 shadow-sky-500/5 shadow-lg",
    spinIcon: true,
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    progressClass: "[&>div]:bg-emerald-400",
    valueClass: "text-emerald-400",
    cardBorder: "border-emerald-500/15",
    spinIcon: false,
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "border-rose-500/40 text-rose-400 bg-rose-500/10",
    progressClass: "[&>div]:bg-rose-400",
    valueClass: "text-rose-400",
    cardBorder: "border-rose-500/20",
    spinIcon: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = STATUS[status] ?? STATUS.pending;
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-mono text-[11px] tracking-wider uppercase",
        cfg.className
      )}
    >
      <Icon className={cn("h-3 w-3", cfg.spinIcon && "animate-spin")} />
      {cfg.label}
    </Badge>
  );
}

function MetaItem({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
        {label}
      </span>
      <span className="font-mono text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function JobCard({
  job,
  onDelete,
  deleting
}: {
  job: Job;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  const router = useRouter();
  const cfg = STATUS[job.status] ?? STATUS.pending;
  const canDelete = job.status === "completed" || job.status === "failed";
  const assignmentHref = job.course_id && job.assignment_id
    ? `/courses/${job.course_id}/assignments/${job.assignment_id}`
    : null;

  return (
    <Card
      className={cn(
        "transition-all duration-300 bg-card/60 backdrop-blur border-border/50",
        job.status === "processing" && cfg.cardBorder
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base leading-tight truncate">
              {job.assignment_title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={job.status} />

            {canDelete && (
              <AlertDialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                          disabled={deleting === job.id}
                        >
                          {deleting === job.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Delete job</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete grading job?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the job for{" "}
                      <span className="font-semibold text-foreground">
                        {job.assignment_title}
                      </span>
                      . This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(job.id)}
                      className="bg-rose-500 text-white hover:bg-rose-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              if (assignmentHref) {
                router.push(assignmentHref)
              }
            }}
            disabled={!assignmentHref}
          >
            <CornerUpLeft className="h-4 w-4" />
            Back to assignment
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">
              {job.processed_submissions} / {job.total_submissions} submissions
            </span>
            <span className={cn("font-mono text-xs font-semibold", cfg.valueClass)}>
              {job.progress}%
            </span>
          </div>
          <Progress
            value={job.progress}
            className={cn("h-1.5 bg-muted/40", cfg.progressClass)}
          />
        </div>

        {/* Error alert */}
        {job.error && (
          <Alert
            variant="destructive"
            className="py-2 px-3 border-rose-500/30 bg-rose-500/5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="font-mono text-xs ml-1">
              {job.error}
            </AlertDescription>
          </Alert>
        )}

        <Separator className="bg-border/40" />

        {/* Timestamps */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <MetaItem label="Created" value={formatDateTime(job.created_at)} />
          <MetaItem label="Started" value={formatDateTime(job.started_at)} />
          <MetaItem label="Completed" value={formatDateTime(job.completed_at)} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// Module-level counts ref so JobCard can access it (passed as prop below in real usage)
let counts: Record<string, number> = { all: 0, pending: 0, processing: 0, completed: 0, failed: 0 };

export default function GradingJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [filter, setFilter] = useState<"all" | JobStatus>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async (manual = false) => {
    if (!user?.token) return;
    if (manual) setRefreshing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/jobs`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setCountdown(10);
      if (manual) setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(), 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  useEffect(() => {
    const tick = setInterval(
      () => setCountdown((c) => (c <= 1 ? 10 : c - 1)),
      1000
    );
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const handleDelete = async (id: string) => {
    if (!user?.token) return;
    setDeleting(id);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/jobs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(null);
    }
  };

  counts = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
  };

  const filtered =
    filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const statCards = [
    { key: "processing" as const, label: "Processing", cls: "text-sky-400", border: "border-sky-500/20" },
    { key: "pending" as const, label: "Pending", cls: "text-amber-400", border: "border-amber-500/20" },
    { key: "completed" as const, label: "Completed", cls: "text-emerald-400", border: "border-emerald-500/20" },
    { key: "failed" as const, label: "Failed", cls: "text-rose-400", border: "border-rose-500/20" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <BreadcrumbNav />
      <div className="flex-1 p-6 md:p-10">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Grading Jobs</h1>
              </div>
              <div className="flex items-center gap-3 pl-12">
                {lastUpdated && (
                  <span className="font-mono text-xs text-muted-foreground/50">
                    Updated{" "}
                    {lastUpdated?.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                  <Timer className="h-3 w-3" />
                  <span className="font-mono text-[11px]">
                    refresh in {countdown}s
                  </span>
                </div>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => fetchJobs(true)}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", refreshing && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh now</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(({ key, label, cls, border }) => (
              <Card
                key={key}
                className={cn(
                  "bg-card/40 backdrop-blur border-border/50 cursor-pointer transition-colors hover:bg-card/60",
                  (counts as Record<string, number>)[key] > 0 && border
                )}
                onClick={() => setFilter(key)}
              >
                <CardContent className="p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1">
                    {label}
                  </p>
                  <p className={cn("text-2xl font-bold tabular-nums", cls)}>
                    {(counts as Record<string, number>)[key]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Filter tabs ── */}
          <Tabs value={filter} onValueChange={(v: string) => setFilter(v as "all" | JobStatus)}>
            <TabsList className="bg-muted/40 border border-border/50 h-9 flex-wrap">
              {["all", "pending", "processing", "completed", "failed"].map((f) => (
                <TabsTrigger
                  key={f}
                  value={f}
                  className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-background"
                >
                  {f}
                  {(counts as Record<string, number>)[f] > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-4 px-1.5 font-mono text-[10px]"
                    >
                      {(counts as Record<string, number>)[f]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin opacity-40" />
              <p className="font-mono text-sm">Loading jobs…</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to fetch jobs: {error}</AlertDescription>
            </Alert>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <ClipboardList className="h-10 w-10 opacity-20" />
              <p className="font-mono text-sm">
                No {filter !== "all" ? filter : ""} jobs found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}