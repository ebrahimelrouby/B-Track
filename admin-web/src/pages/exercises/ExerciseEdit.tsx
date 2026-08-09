import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExerciseForm, { type ExerciseFormData } from "@/components/exercise/ExerciseForm";
import { getExercise, updateExercise } from "@/api/exercises";

export default function ExerciseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => getExercise(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: ExerciseFormData) => updateExercise(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise", id] });
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      navigate(`/exercises/${id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit: {exercise?.name}</h1>
          <p className="text-muted-foreground text-sm">Changes take effect immediately</p>
        </div>
      </div>

      {mutation.error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(mutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercise Details</CardTitle>
        </CardHeader>
        <CardContent>
          {exercise && (
            <ExerciseForm
              defaultValues={exercise}
              onSubmit={(data) => mutation.mutate(data)}
              isSubmitting={mutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
