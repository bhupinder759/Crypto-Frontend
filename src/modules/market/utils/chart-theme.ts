"use client";

export type ChartPalette = {
  text: string;
  grid: string;
  border: string;
  crosshair: string;
  up: string;
  down: string;
  accent: string;
};

let probe: CanvasRenderingContext2D | null = null;

/**
 * Resolves a CSS custom property (any CSS color syntax, including oklch) into
 * an `rgba()` string that lightweight-charts understands.
 */
function resolveCssColor(variable: string, alpha = 1, fallback = "#888"): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  if (!raw) return fallback;

  probe ??= document.createElement("canvas").getContext("2d", {
    willReadFrequently: true,
  });
  if (!probe) return fallback;

  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = fallback;
  probe.fillStyle = raw;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function readChartPalette(): ChartPalette {
  return {
    text: resolveCssColor("--muted-foreground", 1, "#94a3b8"),
    grid: resolveCssColor("--border", 0.5, "rgba(148,163,184,0.08)"),
    border: resolveCssColor("--border", 1, "rgba(148,163,184,0.18)"),
    crosshair: resolveCssColor("--muted-foreground", 0.5, "rgba(148,163,184,0.4)"),
    up: resolveCssColor("--buy", 1, "#10b981"),
    down: resolveCssColor("--sell", 1, "#ef4444"),
    accent: resolveCssColor("--primary", 1, "#38bdf8"),
  };
}
