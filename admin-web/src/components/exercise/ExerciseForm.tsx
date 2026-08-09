import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Exercise } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().optional(),
  muscleGroup: z.string().min(1, "Muscle group required"),
  equipment: z.string().min(1, "Equipment required"),
  difficulty: z.string().min(1, "Difficulty required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  tips: z.string().optional(),
  commonMistakes: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  gifUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().optional(),
  movementPattern: z.string().optional(),
  mechanic: z.string().optional(),
  forceType: z.string().optional(),
  licenseType: z.string().optional(),
  attribution: z.string().optional(),
});

export type ExerciseFormData = z.infer<typeof schema>;

const MUSCLE_GROUPS = [
  "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "FOREARMS",
  "CORE", "GLUTES", "QUADRICEPS", "HAMSTRINGS", "CALVES", "FULL_BODY", "CARDIO", "OTHER",
];
const EQUIPMENT = [
  "BARBELL", "DUMBBELL", "MACHINE", "CABLE", "BODYWEIGHT",
  "KETTLEBELL", "RESISTANCE_BAND", "SMITH_MACHINE", "OTHER",
];
const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

interface Props {
  defaultValues?: Partial<Exercise>;
  onSubmit: (data: ExerciseFormData) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function ExerciseForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Save" }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      muscleGroup: defaultValues?.muscleGroup ?? "",
      equipment: defaultValues?.equipment ?? "",
      difficulty: defaultValues?.difficulty ?? "",
      description: defaultValues?.description ?? "",
      instructions: defaultValues?.instructions ?? "",
      tips: defaultValues?.tips ?? "",
      commonMistakes: defaultValues?.commonMistakes ?? "",
      imageUrl: defaultValues?.imageUrl ?? "",
      gifUrl: defaultValues?.gifUrl ?? "",
      category: defaultValues?.category ?? "",
      movementPattern: defaultValues?.movementPattern ?? "",
      mechanic: defaultValues?.mechanic ?? "",
      forceType: defaultValues?.forceType ?? "",
      licenseType: defaultValues?.licenseType ?? "",
      attribution: defaultValues?.attribution ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Name *</Label>
          <Input {...register("name")} placeholder="Exercise name" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Slug (auto-generated if empty)</Label>
          <Input {...register("slug")} placeholder="barbell-bench-press" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input {...register("category")} placeholder="e.g. Compound, Isolation" />
        </div>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Muscle Group *</Label>
          <Controller
            name="muscleGroup"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.muscleGroup && <p className="text-xs text-destructive">{errors.muscleGroup.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Equipment *</Label>
          <Controller
            name="equipment"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {EQUIPMENT.map((e) => (
                    <SelectItem key={e} value={e}>{e.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.equipment && <p className="text-xs text-destructive">{errors.equipment.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Difficulty *</Label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty.message}</p>}
        </div>
      </div>

      {/* Biomechanics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Movement Pattern</Label>
          <Input {...register("movementPattern")} placeholder="e.g. Push, Pull, Squat" />
        </div>
        <div className="space-y-2">
          <Label>Mechanic</Label>
          <Input {...register("mechanic")} placeholder="Compound / Isolation" />
        </div>
        <div className="space-y-2">
          <Label>Force Type</Label>
          <Input {...register("forceType")} placeholder="Push / Pull / Static" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...register("description")} placeholder="Brief overview" rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Instructions (step-by-step)</Label>
          <Textarea {...register("instructions")} placeholder="Step 1. Lie flat on bench..." rows={4} />
        </div>
        <div className="space-y-2">
          <Label>Tips</Label>
          <Textarea {...register("tips")} placeholder="Pro tips for better performance" rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Common Mistakes</Label>
          <Textarea {...register("commonMistakes")} placeholder="What to avoid" rows={3} />
        </div>
      </div>

      {/* Media */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Image URL</Label>
          <Input {...register("imageUrl")} placeholder="https://..." />
          {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>GIF URL</Label>
          <Input {...register("gifUrl")} placeholder="https://..." />
          {errors.gifUrl && <p className="text-xs text-destructive">{errors.gifUrl.message}</p>}
        </div>
      </div>

      {/* License */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>License Type</Label>
          <Input {...register("licenseType")} placeholder="MIT / CC0 / CC-BY-4.0 / unknown" />
        </div>
        <div className="space-y-2">
          <Label>Attribution</Label>
          <Input {...register("attribution")} placeholder="Author / source name" />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
