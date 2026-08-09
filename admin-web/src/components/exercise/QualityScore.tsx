import { cn } from "@/lib/utils";

interface Props {
  score: number;
  showLabel?: boolean;
}

export default function QualityScore({ score, showLabel = false }: Props) {
  const color =
    score >= 80 ? "text-green-600 dark:text-green-400" :
    score >= 50 ? "text-yellow-600 dark:text-yellow-400" :
    "text-red-500 dark:text-red-400";

  const barColor =
    score >= 80 ? "bg-green-500" :
    score >= 50 ? "bg-yellow-500" :
    "bg-red-400";

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", color)}>
        {showLabel ? `${score}%` : score}
      </span>
    </div>
  );
}
