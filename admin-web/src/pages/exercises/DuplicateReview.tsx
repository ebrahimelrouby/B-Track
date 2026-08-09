import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GitMerge, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/exercise/StatusBadge";
import { listExercises, findDuplicates, changeExerciseStatus } from "@/api/exercises";
import type { Exercise } from "@/types";

export default function DuplicateReview() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [duplicates, setDuplicates] = useState<Exercise[]>([]);

  const { data: exercises } = useQuery({
    queryKey: ["exercises-simple"],
    queryFn: () => listExercises({ size: 200 }),
  });

  const findMutation = useMutation({
    mutationFn: () => findDuplicates(selectedId),
    onSuccess: (data) => setDuplicates(data),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => changeExerciseStatus(id, "ARCHIVED", "Duplicate — superseded"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      setDuplicates((prev) => prev.filter((d) => !archiveMutation.variables || d.id !== archiveMutation.variables));
    },
  });

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Duplicate Review" description="Find exercises that may be duplicated by name or slug" />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Select exercise to check for duplicates</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an exercise..." />
                </SelectTrigger>
                <SelectContent>
                  {exercises?.content.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => findMutation.mutate()}
              disabled={!selectedId || findMutation.isPending}
            >
              <GitMerge className="mr-2 h-4 w-4" />Find Duplicates
            </Button>
          </div>
        </CardContent>
      </Card>

      {findMutation.isSuccess && (
        <>
          {duplicates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitMerge className="h-10 w-10 mx-auto mb-3 text-green-500" />
              <p className="font-medium">No duplicates found</p>
              <p className="text-sm">This exercise appears to be unique</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">{duplicates.length} potential duplicate(s) found:</p>
              {duplicates.map((dup) => (
                <Card key={dup.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{dup.name}</span>
                        <StatusBadge status={dup.status} />
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{dup.slug}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {dup.muscleGroup?.replace(/_/g, " ")} · {dup.equipment?.replace(/_/g, " ")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveMutation.mutate(dup.id)}
                      disabled={archiveMutation.isPending}
                    >
                      <Archive className="mr-1 h-4 w-4" />Archive Duplicate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
