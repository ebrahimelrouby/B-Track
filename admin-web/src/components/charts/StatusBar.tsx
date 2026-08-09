import { useState } from "react";

interface StatusSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface StatusBarProps {
  segments: StatusSegment[];
}

export default function StatusBar({ segments }: StatusBarProps) {
  const [active, setActive] = useState<string | null>(null);
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const visible = segments.filter((seg) => seg.value > 0);

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No exercises yet</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-6 w-full gap-[2px]">
        {visible.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const isFirst = i === 0;
          const isLast = i === visible.length - 1;
          return (
            <div
              key={seg.key}
              tabIndex={0}
              className={`group relative h-full outline-none transition-[filter] duration-150 hover:brightness-110 focus:brightness-110 ${
                isFirst ? "rounded-l-md" : ""
              } ${isLast ? "rounded-r-md" : ""}`}
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              onMouseEnter={() => setActive(seg.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(seg.key)}
              onBlur={() => setActive(null)}
            >
              {pct >= 12 && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {seg.value}
                </span>
              )}
              <div
                role="tooltip"
                className={`pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md transition-opacity ${
                  active === seg.key ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className="font-semibold">{seg.value}</span> {seg.label} · {Math.round(pct)}%
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
