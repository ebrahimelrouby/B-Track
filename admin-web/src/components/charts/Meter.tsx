interface MeterProps {
  value: number;
  label: string;
}

export default function Meter({ value, label }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-3xl font-bold">{Math.round(clamped)}%</span>
      <div className="h-2 w-full rounded-full bg-primary/15">
        <div
          className="h-2 rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
