import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/exercise/StatusBadge";
import { listExercises, bulkChangeStatus } from "@/api/exercises";
import type { ExerciseStatus } from "@/types";

const STATUSES: ExerciseStatus[] = ["DRAFT", "REVIEWED", "PUBLISHED", "ARCHIVED", "REJECTED"];

export default function BulkEdit() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["exercises-bulk", filterStatus],
    queryFn: () => listExercises({ status: filterStatus || undefined, size: 100 }),
  });

  const exercises = data?.content ?? [];

  const mutation = useMutation({
    mutationFn: () => bulkChangeStatus([...selected], targetStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exercises-bulk"] });
      setSelected(new Set());
    },
  });

  function toggleAll() {
    if (selected.size === exercises.length) setSelected(new Set());
    else setSelected(new Set(exercises.map((e) => e.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Bulk Edit" description="Select multiple exercises and change their status" />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-2">
              <Label>Filter by status</Label>
              <Select value={filterStatus || "_all"} onValueChange={(v) => setFilterStatus(v === "_all" ? "" : v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Change selected to</Label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={selected.size === 0 || !targetStatus || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Apply to {selected.size} exercise{selected.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="p-3 text-left">
                <input type="checkbox" checked={exercises.length > 0 && selected.size === exercises.length} onChange={toggleAll} className="rounded" />
              </th>
              <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="p-3 text-left font-medium text-muted-foreground">Muscle</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex) => (
              <tr key={ex.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => toggle(ex.id)}>
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(ex.id)} onChange={() => toggle(ex.id)} className="rounded" onClick={(e) => e.stopPropagation()} />
                </td>
                <td className="p-3 font-medium">{ex.name}</td>
                <td className="p-3"><StatusBadge status={ex.status} /></td>
                <td className="p-3 text-muted-foreground capitalize">{ex.muscleGroup?.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
