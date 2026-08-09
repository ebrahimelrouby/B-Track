import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Sparkles, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/api/exercises";
import BarList from "@/components/charts/BarList";
import StatusBar from "@/components/charts/StatusBar";
import Meter from "@/components/charts/Meter";
import TrendLine from "@/components/charts/TrendLine";
import PageHeader from "@/components/layout/PageHeader";

// Reuses the same status semantics as StatusBadge (green=published, amber=draft,
// indigo=reviewed, slate=archived, red=rejected) for consistency across the app.
// Values validated for CVD-safe adjacent separation; slate is an intentional
// desaturated exception (neutral/inactive), paired with a direct label per segment.
const STATUS_COLOR = {
  published: "#16a34a",
  draft: "#d97706",
  reviewed: "#4f46e5",
  archived: "#64748b",
  rejected: "#dc2626",
} as const;

// Same red/amber/green trio as STATUS_COLOR above (already validated together for
// CVD-safe adjacent separation), reused here since it carries the same bad→good meaning.
const QUALITY_COLOR = { POOR: "#dc2626", FAIR: "#d97706", GREAT: "#16a34a" } as const;
const QUALITY_LABEL = { POOR: "Poor", FAIR: "Fair", GREAT: "Great" } as const;
const DIFFICULTY_COLOR = "#7c3aed";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-32 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-64 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Exercises",
      value: stats?.totalExercises,
      icon: Dumbbell,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/60",
    },
    {
      label: "Custom Exercises",
      value: stats?.customExercises,
      icon: Sparkles,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/60",
    },
    {
      label: "Total Imports",
      value: stats?.totalImports,
      icon: Upload,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/60",
    },
  ];

  const statusSegments = [
    { key: "published", label: "Published", value: stats?.publishedExercises ?? 0, color: STATUS_COLOR.published },
    { key: "draft", label: "Draft", value: stats?.draftExercises ?? 0, color: STATUS_COLOR.draft },
    { key: "reviewed", label: "Reviewed", value: stats?.reviewedExercises ?? 0, color: STATUS_COLOR.reviewed },
    { key: "archived", label: "Archived", value: stats?.archivedExercises ?? 0, color: STATUS_COLOR.archived },
    { key: "rejected", label: "Rejected", value: stats?.rejectedExercises ?? 0, color: STATUS_COLOR.rejected },
  ];

  const muscleData = Object.entries(stats?.byMuscleGroup ?? {}).map(([label, value]) => ({ label, value }));
  const equipData = Object.entries(stats?.byEquipment ?? {}).map(([label, value]) => ({ label, value }));

  const difficultyOrder = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const difficultyData = difficultyOrder.map((label) => ({
    label,
    value: stats?.byDifficulty[label] ?? 0,
  }));

  const qualityOrder = ["POOR", "FAIR", "GREAT"] as const;
  const qualityData = qualityOrder.map((key) => ({
    label: QUALITY_LABEL[key],
    value: stats?.qualityScoreBuckets[key] ?? 0,
    color: QUALITY_COLOR[key],
  }));

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Dashboard" description="Exercise management overview" />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value ?? "—"}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-6">
            <Meter value={stats?.averageQualityScore ?? 0} label="Avg Quality Score" />
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercise Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBar segments={statusSegments} />
        </CardContent>
      </Card>

      {/* Activity trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Activity — Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLine data={stats?.activityTrend ?? []} />
        </CardContent>
      </Card>

      {/* Distribution charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Muscle Group</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={muscleData} color="hsl(var(--primary))" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={equipData} color="#2a78d6" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={difficultyData} color={DIFFICULTY_COLOR} sortByValue={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Score Distribution</CardTitle>
            <CardDescription>Poor 0–49 · Fair 50–79 · Great 80–100</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList data={qualityData} color={DIFFICULTY_COLOR} sortByValue={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
