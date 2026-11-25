import { memo } from "react";
import { cn } from "@/lib/utils";

/** Lightweight SVG sparkline (no chart lib) for tables and watchlists. */
export const Sparkline = memo(function Sparkline({
  values,
  width = 96,
  height = 28,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (values.length < 2) {
    return (
      <div
        style={{ width, height }}
        className={cn("flex items-center", className)}
        aria-hidden
      >
        <div className="h-px w-full bg-border" />
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)}`)
    .join(" ");
  const up = values.at(-1)! >= values[0]!;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn(up ? "text-buy" : "text-sell", className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
});
