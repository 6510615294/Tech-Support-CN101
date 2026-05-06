"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps
} from "recharts";

interface Distribution {
  range_start: number;
  range_end: number;
  count: number;
}

interface SubmissionStatistic {
  students: number;
  submitted: number;
  incomplete: number;
  not_started: number;
  submission_rate: number;
  graded: number;
  ungrade: number;
  avg_score: number;
  highest_score: number;
  lowest_score: number;
  median_score: number;
  distribution: Distribution[];
}

interface SummaryChartProps {
  statistic: SubmissionStatistic;
  maxPoint?: number | null;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-1"
      style={{ borderColor: accent ? `${accent}33` : undefined }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ProgressRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function SubmissionPill({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 min-w-[110px]">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums w-8 text-right">{count}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background shadow-md px-4 py-2 text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground">
          <span className="text-orange-500 font-bold">{payload[0].value}</span> students
        </p>
      </div>
    );
  }
  return null;
};

export default function SummaryChartSummaryChart({ statistic, maxPoint }: SummaryChartProps) {
  const toOptionalNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const avgScore = toOptionalNumber(statistic.avg_score) ?? 0
  const medianScore = toOptionalNumber(statistic.median_score) ?? 0
  const highestScore = toOptionalNumber(statistic.highest_score) ?? 0
  const lowestScore = toOptionalNumber(statistic.lowest_score) ?? 0
  const graded = statistic.graded ?? 0
  const ungraded = statistic.ungrade ?? 0
  const submitted = statistic.submitted ?? 0
  const submissionRate = statistic.submission_rate ?? 0

  const chartData = statistic.distribution.map((d) => ({
    name: `${d.range_start}–${d.range_end}`,
    count: d.count,
  }));

  const maxCount = Math.max(...statistic.distribution.map((d) => d.count));

  return (
    <div className="mt-10 px-4 pb-16 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Assignment Summary</h1>
        <p className="text-sm text-muted-foreground">Overview of student submissions and scores</p>
      </div>

      {/* Submission Rate Hero Card */}
      <div className="rounded-2xl border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 dark:border-green-900/40 p-6 flex items-center gap-6">
        <div className="relative flex items-center justify-center">
          <ProgressRing value={submissionRate} size={90} />
          <span className="absolute text-lg font-bold text-green-600 dark:text-green-400">
            {submissionRate}%
          </span>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-widest">
              Submission Rate
            </p>
            <p className="text-3xl font-bold text-green-800 dark:text-green-300">
              {statistic.submitted} / {statistic.students}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">students submitted</p>
          </div>
          <div className="space-y-2">
            <SubmissionPill label="Submitted" count={statistic.submitted} total={statistic.students} color="#22c55e" />
            <SubmissionPill label="Incomplete" count={statistic.incomplete} total={statistic.students} color="#f59e0b" />
            <SubmissionPill label="Not Started" count={statistic.not_started} total={statistic.students} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* Score Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={maxPoint != null ? `Average Score (/${maxPoint})` : "Average Score"} value={avgScore !== undefined ? (typeof avgScore === 'number' ? avgScore.toFixed(2) : avgScore) : '0.00'} accent="#f97316" />
        <StatCard label={maxPoint != null ? `Median Score (/${maxPoint})` : "Median Score"} value={medianScore !== undefined ? medianScore : 0} accent="#8b5cf6" />
        <StatCard label={maxPoint != null ? `Highest Score (/${maxPoint})` : "Highest Score"} value={highestScore !== undefined ? highestScore : 0} accent="#22c55e" sub="Top performer" />
        <StatCard label={maxPoint != null ? `Lowest Score (/${maxPoint})` : "Lowest Score"} value={lowestScore !== undefined ? lowestScore : 0} accent="#ef4444" sub="Needs attention" />
      </div>

      {/* Grading Status */}
      <div className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Grading Progress</p>
          <p className="text-2xl font-bold tabular-nums">
            {graded}{" "}
            <span className="text-base font-normal text-muted-foreground">/ {submitted} graded</span>
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-muted-foreground">
              Graded: <span className="font-semibold text-foreground">{graded}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-muted-foreground">
              Pending: <span className="font-semibold text-foreground">{ungraded}</span>
            </span>
          </div>
        </div>
        <div className="w-full sm:w-48 bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-green-500 transition-all duration-700"
            style={{ width: `${submitted > 0 ? (graded / submitted) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Score Distribution</p>
          <p className="text-xs text-muted-foreground">Number of students per score range</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6", radius: 6 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.count === maxCount ? "#f97316" : "#fed7aa"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}