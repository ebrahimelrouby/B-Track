import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";

interface TrendLineProps {
  data: { date: string; count: number }[];
  color?: string;
  height?: number;
}

const PAD = { top: 12, right: 12, bottom: 24, left: 28 };

export default function TrendLine({ data, color = "hsl(var(--primary))", height = 220 }: TrendLineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 640;

  const { points, yTicks, maxY, path, areaPath } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.count));
    // Round the axis ceiling to a clean step (1, 2, 5, 10, 20, 50...)
    const rawStep = max / 3;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, rawStep))));
    const step = Math.ceil(rawStep / magnitude) * magnitude || 1;
    const ceiling = step * 3;

    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;

    const pts = data.map((d, i) => {
      const x = PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = PAD.top + innerH - (d.count / ceiling) * innerH;
      return { x, y, ...d };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const baseline = PAD.top + innerH;
    const area = `${linePath} L ${pts[pts.length - 1]?.x ?? PAD.left} ${baseline} L ${pts[0]?.x ?? PAD.left} ${baseline} Z`;

    return {
      points: pts,
      yTicks: [0, step, step * 2, ceiling],
      maxY: ceiling,
      path: linePath,
      areaPath: area,
    };
  }, [data, height]);

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const localX = (e.clientX - rect.left) * scaleX;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - localX);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const innerH = height - PAD.top - PAD.bottom;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground" style={{ height }}>
        No activity in this period
      </div>
    );
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none"
        style={{ height }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Admin activity over the last 14 days"
      >
        {/* Gridlines */}
        {yTicks.map((t) => {
          const y = PAD.top + innerH - (t / maxY) * innerH;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
                {t}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text
              key={p.date}
              x={p.x}
              y={height - PAD.bottom + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {format(parseISO(p.date), "MMM d")}
            </text>
          ) : null
        )}

        {/* Area + line */}
        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* Crosshair */}
        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD.top}
            y2={height - PAD.bottom}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}

        {/* End marker on the last point, always visible */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={4}
            fill={color}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          />
        )}

        {/* Hover marker */}
        {hovered && (
          <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="hsl(var(--card))" strokeWidth={2} />
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            top: `${(hovered.y / height) * 100 - 4}%`,
          }}
        >
          <div className="font-semibold tabular-nums">{hovered.count} action{hovered.count === 1 ? "" : "s"}</div>
          <div className="text-muted-foreground">{format(parseISO(hovered.date), "MMM d, yyyy")}</div>
        </div>
      )}
    </div>
  );
}
