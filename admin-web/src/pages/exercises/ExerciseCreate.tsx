import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExerciseForm, { type ExerciseFormData } from "@/components/exercise/ExerciseForm";
import { createExercise } from "@/api/exercises";

export default function ExerciseCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createExercise,
    onSuccess: (ex) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      navigate(`/exercises/${ex.id}`);
    },
  });

  function onSubmit(data: ExerciseFormData) {
    mutation.mutate(data);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Exercise</h1>
          <p className="text-muted-foreground text-sm">New exercise starts as DRAFT</p>
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
          <ExerciseForm
            onSubmit={onSubmit}
            isSubmitting={mutation.isPending}
            submitLabel="Create Exercise"
          />
        </CardContent>
      </Card>
    </div>
  );
}
