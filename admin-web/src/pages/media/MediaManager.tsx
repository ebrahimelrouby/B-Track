import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Image, Video, Film, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import { listExercises, listMedia, addMedia, deleteMedia } from "@/api/exercises";
import type { ExerciseMedia } from "@/types";

const MEDIA_TYPES = ["IMAGE", "GIF", "VIDEO", "THUMBNAIL", "SVG_OVERLAY", "LOTTIE"];
const MEDIA_ICONS: Record<string, React.ReactNode> = {
  IMAGE: <Image className="h-4 w-4" />,
  GIF: <Film className="h-4 w-4" />,
  VIDEO: <Video className="h-4 w-4" />,
  THUMBNAIL: <Image className="h-4 w-4" />,
  SVG_OVERLAY: <Image className="h-4 w-4" />,
  LOTTIE: <Film className="h-4 w-4" />,
};

export default function MediaManager() {
  const queryClient = useQueryClient();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: exercises } = useQuery({
    queryKey: ["exercises-simple"],
    queryFn: () => listExercises({ size: 200 }),
  });

  const { data: media = [] } = useQuery({
    queryKey: ["exercise-media", selectedExerciseId],
    queryFn: () => listMedia(selectedExerciseId),
    enabled: !!selectedExerciseId,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ mediaId }: { mediaId: string }) =>
      deleteMedia(selectedExerciseId, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercise-media", selectedExerciseId] }),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { mediaType: "IMAGE", url: "", provider: "", licenseType: "", author: "", attribution: "" },
  });
  const mediaType = watch("mediaType");

  const addMutation = useMutation({
    mutationFn: (data: Partial<ExerciseMedia>) => addMedia(selectedExerciseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercise-media", selectedExerciseId] });
      reset();
      setShowAdd(false);
    },
  });

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Media Manager" description="Manage exercise images, GIFs, and videos" />

      {/* Exercise selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Select Exercise</Label>
              <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose an exercise to manage media..." />
                </SelectTrigger>
                <SelectContent>
                  {exercises?.content.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedExerciseId && (
              <Button onClick={() => setShowAdd(true)} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />Add Media
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add media form */}
      {showAdd && selectedExerciseId && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Media</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((data) => addMutation.mutate(data as Partial<ExerciseMedia>))} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Media Type</Label>
                <Select value={mediaType} onValueChange={(v) => setValue("mediaType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input {...register("url", { required: true })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input {...register("provider")} placeholder="e.g. free-exercise-db" />
              </div>
              <div className="space-y-2">
                <Label>License Type</Label>
                <Input {...register("licenseType")} placeholder="MIT / CC0 / unknown" />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input {...register("author")} placeholder="Attribution name" />
              </div>
              <div className="space-y-2">
                <Label>Attribution Text</Label>
                <Input {...register("attribution")} placeholder="e.g. yuhonas/free-exercise-db" />
              </div>
              <div className="col-span-2 flex gap-3">
                <Button type="submit" disabled={addMutation.isPending}>Add Media</Button>
                <Button type="button" variant="outline" onClick={() => { reset(); setShowAdd(false); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Media grid */}
      {selectedExerciseId && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No media attached to this exercise
            </div>
          ) : (
            media.map((m) => (
              <Card key={m.id} className="group relative overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {m.mediaType === "IMAGE" || m.mediaType === "GIF" || m.mediaType === "THUMBNAIL" ? (
                    <img
                      src={m.url}
                      alt={m.mediaType}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {MEDIA_ICONS[m.mediaType]}
                      <span className="text-xs">{m.mediaType}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-xs font-medium">
                        {MEDIA_ICONS[m.mediaType]}
                        {m.mediaType}
                      </div>
                      {m.licenseType && (
                        <div className="text-xs text-muted-foreground mt-0.5">{m.licenseType}</div>
                      )}
                      {m.author && (
                        <div className="text-xs text-muted-foreground truncate">{m.author}</div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate({ mediaId: m.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
