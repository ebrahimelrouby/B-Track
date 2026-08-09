import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import { listExercises, listTranslations, saveTranslation } from "@/api/exercises";
import type { ExerciseTranslation } from "@/types";

const LOCALES = [
  { code: "ar", label: "Arabic (العربية)" },
  { code: "fr", label: "French (Français)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "de", label: "German (Deutsch)" },
];

export default function TranslationManager() {
  const queryClient = useQueryClient();
  const [exerciseId, setExerciseId] = useState("");
  const [locale, setLocale] = useState("ar");
  const [form, setForm] = useState<Partial<ExerciseTranslation>>({});

  const { data: exercises } = useQuery({
    queryKey: ["exercises-simple"],
    queryFn: () => listExercises({ size: 200 }),
  });

  const { data: translations = [] } = useQuery({
    queryKey: ["translations", exerciseId],
    queryFn: () => listTranslations(exerciseId),
    enabled: !!exerciseId,
  });

  const mutation = useMutation({
    mutationFn: () => saveTranslation(exerciseId, locale, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations", exerciseId] });
    },
  });

  function loadLocale(newLocale: string) {
    setLocale(newLocale);
    const existing = translations.find((t) => t.locale === newLocale);
    setForm(existing ?? {});
  }

  const selectedExercise = exercises?.content.find((e) => e.id === exerciseId);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader title="Translation Manager" description="Add translations for exercises (EN is the canonical language)" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Exercise</Label>
          <Select value={exerciseId} onValueChange={setExerciseId}>
            <SelectTrigger><SelectValue placeholder="Select exercise..." /></SelectTrigger>
            <SelectContent>
              {exercises?.content.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={locale} onValueChange={loadLocale}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {exerciseId && selectedExercise && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedExercise.name} — {LOCALES.find((l) => l.code === locale)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={selectedExercise.name}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                placeholder={selectedExercise.instructions ?? ""}
                rows={4}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label>Tips</Label>
              <Textarea
                value={form.tips ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, tips: e.target.value }))}
                placeholder={selectedExercise.tips ?? ""}
                rows={3}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-2">
              <Label>Common Mistakes</Label>
              <Textarea
                value={form.commonMistakes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, commonMistakes: e.target.value }))}
                rows={3}
                dir={locale === "ar" ? "rtl" : "ltr"}
              />
            </div>

            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />Save Translation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
