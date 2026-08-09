import { useState } from "react";

interface BarListItem {
  label: string;
  value: number;
  color?: string;
}

interface BarListProps {
  data: BarListItem[];
  color: string;
  maxItems?: number;
  sortByValue?: boolean;
}

export default function BarList({ data, color, maxItems = 9, sortByValue = true }: BarListProps) {
  const [active, setActive] = useState<number | null>(null);
  const ordered = sortByValue ? [...data].sort((a, b) => b.value - a.value) : data;
  const sorted = ordered.slice(0, maxItems);
  const max = Math.max(1, ...sorted.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (sorted.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const widthPct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div
            key={item.label}
            tabIndex={0}
            className="group relative flex items-center gap-3 outline-none"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <span className="w-28 shrink-0 truncate text-sm capitalize text-foreground/80">
              {item.label.replace(/_/g, " ").toLowerCase()}
            </span>
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div
                className="h-2 rounded-r-[4px] transition-[width,filter] duration-300 ease-out group-hover:brightness-110 group-focus:brightness-110"
                style={{ width: `${widthPct}%`, backgroundColor: item.color ?? color }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
              {item.value}
            </span>

            <div
              role="tooltip"
              className={`pointer-events-none absolute -top-8 left-28 z-10 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md transition-opacity ${
                active === i ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="font-semibold">{item.value}</span> · {pct}% of total
            </div>
          </div>
        );
      })}
    </div>
  );
}
