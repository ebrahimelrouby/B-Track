import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, CheckCircle, XCircle, Archive, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/exercise/StatusBadge";
import QualityScore from "@/components/exercise/QualityScore";
import { getExercise, changeExerciseStatus } from "@/api/exercises";
import type { ExerciseStatus } from "@/types";

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => getExercise(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      changeExerciseStatus(id!, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercise", id] }),
  });

  if (isLoading || !exercise) {
    return <div className="p-8"><div className="h-8 w-48 bg-muted rounded animate-pulse" /></div>;
  }

  const canPublish = exercise.status === "DRAFT" || exercise.status === "REVIEWED";
  const canArchive = exercise.status === "PUBLISHED";
  const canReview = exercise.status === "DRAFT";
  const canReject = exercise.status !== "REJECTED" && exercise.status !== "ARCHIVED";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{exercise.name}</h1>
            <StatusBadge status={exercise.status} />
          </div>
          <p className="text-muted-foreground text-sm font-mono mt-0.5">{exercise.slug}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/exercises/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
        </Button>
      </div>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        {canReview && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => statusMutation.mutate({ status: "REVIEWED" })}
            disabled={statusMutation.isPending}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-950/60"
          >
            <Eye className="mr-1 h-4 w-4" />Mark Reviewed
          </Button>
        )}
        {canPublish && (
          <Button
            size="sm"
            onClick={() => statusMutation.mutate({ status: "PUBLISHED" })}
            disabled={statusMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-1 h-4 w-4" />Publish
          </Button>
        )}
        {canArchive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => statusMutation.mutate({ status: "ARCHIVED" })}
            disabled={statusMutation.isPending}
          >
            <Archive className="mr-1 h-4 w-4" />Archive
          </Button>
        )}
        {canReject && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => statusMutation.mutate({ status: "REJECTED", reason: "Manual rejection" })}
            disabled={statusMutation.isPending}
          >
            <XCircle className="mr-1 h-4 w-4" />Reject
          </Button>
        )}
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="p-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <Field label="Muscle Group" value={exercise.muscleGroup?.replace(/_/g, " ")} />
          <Field label="Equipment" value={exercise.equipment?.replace(/_/g, " ")} />
          <Field label="Difficulty" value={exercise.difficulty} />
          <Field label="Category" value={exercise.category} />
          <Field label="Movement Pattern" value={exercise.movementPattern} />
          <Field label="Mechanic" value={exercise.mechanic} />
          <Field label="Force Type" value={exercise.forceType} />
          <Field label="License" value={exercise.licenseType} />
          <Field label="Source Provider" value={exercise.sourceProvider} />
          <Field label="External ID" value={exercise.externalId} />
          <div>
            <p className="text-muted-foreground">Quality Score</p>
            <div className="mt-1"><QualityScore score={exercise.qualityScore} showLabel /></div>
          </div>
          <Field label="Published" value={exercise.publishedAt ? new Date(exercise.publishedAt).toLocaleDateString() : "—"} />
        </CardContent>
      </Card>

      {/* Content sections */}
      {[
        ["Description", exercise.description],
        ["Instructions", exercise.instructions],
        ["Tips", exercise.tips],
        ["Common Mistakes", exercise.commonMistakes],
      ].map(([title, content]) => content ? (
        <Card key={title as string}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {content}
          </CardContent>
        </Card>
      ) : null)}

      {/* Attribution */}
      {exercise.attribution && (
        <div className="text-xs text-muted-foreground">
          Attribution: {exercise.attribution} · {exercise.licenseType}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium capitalize mt-0.5">{value ?? "—"}</p>
    </div>
  );
}
