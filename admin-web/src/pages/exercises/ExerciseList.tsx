import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Trash2, Eye, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/exercise/StatusBadge";
import QualityScore from "@/components/exercise/QualityScore";
import { listExercises, changeExerciseStatus } from "@/api/exercises";
import type { ExerciseStatus } from "@/types";
import { useAuthStore } from "@/auth/authStore";

const MUSCLE_GROUPS = [
  "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS",
  "CORE", "GLUTES", "QUADRICEPS", "HAMSTRINGS", "CALVES", "FULL_BODY", "CARDIO", "OTHER",
];

const STATUSES: ExerciseStatus[] = ["DRAFT", "REVIEWED", "PUBLISHED", "ARCHIVED", "REJECTED"];

export default function ExerciseList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSuperAdmin = useAuthStore((s) => s.role === "SUPER_ADMIN");

  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["exercises", { search, muscleGroup, status, page }],
    queryFn: () => listExercises({ search: search || undefined, muscleGroup: muscleGroup || undefined, status: status || undefined, page }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      changeExerciseStatus(id, newStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises"] }),
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (data?.content.every((e) => selected.has(e.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data?.content.map((e) => e.id) ?? []));
    }
  }

  const exercises = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Exercises"
        description={`${totalElements} total exercises`}
        actions={
          <Button asChild>
            <Link to="/exercises/create">
              <Plus className="mr-2 h-4 w-4" />
              New Exercise
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={status || "_all"} onValueChange={(v) => { setStatus(v === "_all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={muscleGroup || "_all"} onValueChange={(v) => { setMuscleGroup(v === "_all" ? "" : v); setPage(0); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All muscles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All muscles</SelectItem>
                {MUSCLE_GROUPS.map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={exercises.length > 0 && exercises.every((e) => selected.has(e.id))}
                    onChange={selectAll}
                    className="rounded"
                  />
                </th>
                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Muscle</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Equipment</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Difficulty</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Quality</th>
                <th className="p-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : exercises.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No exercises found
                  </td>
                </tr>
              ) : (
                exercises.map((ex) => (
                  <tr key={ex.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(ex.id)}
                        onChange={() => toggleSelect(ex.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{ex.name}</div>
                      {ex.slug && <div className="text-xs text-muted-foreground">{ex.slug}</div>}
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">
                      {ex.muscleGroup?.replace(/_/g, " ")}
                    </td>
                    <td className="p-3 capitalize text-muted-foreground">
                      {ex.equipment?.replace(/_/g, " ")}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${
                        ex.difficulty === "BEGINNER" ? "text-green-600 dark:text-green-400" :
                        ex.difficulty === "INTERMEDIATE" ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
                      }`}>{ex.difficulty}</span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={ex.status} />
                    </td>
                    <td className="p-3">
                      <QualityScore score={ex.qualityScore} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => navigate(`/exercises/${ex.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => navigate(`/exercises/${ex.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {ex.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950/60"
                            onClick={() => publishMutation.mutate({ id: ex.id, newStatus: "PUBLISHED" })}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
