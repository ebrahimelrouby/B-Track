import { Badge } from "@/components/ui/badge";
import type { ExerciseStatus } from "@/types";

const STATUS_CONFIG: Record<ExerciseStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "muted" }> = {
  DRAFT:     { label: "Draft",     variant: "muted" },
  REVIEWED:  { label: "Reviewed",  variant: "info" },
  PUBLISHED: { label: "Published", variant: "success" },
  ARCHIVED:  { label: "Archived",  variant: "secondary" },
  REJECTED:  { label: "Rejected",  variant: "destructive" },
};

export default function StatusBadge({ status }: { status: ExerciseStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
