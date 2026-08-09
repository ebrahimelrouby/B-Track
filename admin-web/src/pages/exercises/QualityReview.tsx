import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/exercise/StatusBadge";
import QualityScore from "@/components/exercise/QualityScore";
import { listExercises, changeExerciseStatus } from "@/api/exercises";

export default function QualityReview() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["exercises-draft"],
    queryFn: () => listExercises({ status: "DRAFT", size: 50 }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => changeExerciseStatus(id, "REVIEWED"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercises-draft"] }),
  });

  const exercises = data?.content ?? [];

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Quality Review" description={`${exercises.length} draft exercises awaiting review`} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm">No draft exercises pending review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ex.name}</span>
                      <StatusBadge status={ex.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{ex.muscleGroup?.replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{ex.equipment?.replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{ex.difficulty}</span>
                      {ex.sourceProvider && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-xs">{ex.sourceProvider}</span>
                        </>
                      )}
                    </div>

                    {/* Quality checklist */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        ["Instructions", !!ex.instructions],
                        ["Description", !!ex.description],
                        ["Tips", !!ex.tips],
                        ["Image", !!ex.imageUrl],
                        ["GIF", !!ex.gifUrl],
                        ["Category", !!ex.category],
                        ["Movement", !!ex.movementPattern],
                      ].map(([label, ok]) => (
                        <span
                          key={label as string}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ok ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ok ? "✓" : "○"} {label}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2">
                      <QualityScore score={ex.qualityScore} showLabel />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate({ id: ex.id })}
                    disabled={publishMutation.isPending}
                    variant="outline"
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-950/60"
                  >
                    Mark Reviewed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
