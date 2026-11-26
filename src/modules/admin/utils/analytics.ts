/**
 * Admin charts derived from existing endpoints (no time-series API yet):
 * user growth from user `createdAt`, market volume from daily candles.
 */
import type { MarketData } from "@/modules/market/types/market-data";

const DAY = 86_400_000;

function dayKey(time: number) {
  const d = new Date(time);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export type GrowthPoint = { day: number; signups: number; total: number };

export function buildUserGrowth(
  users: { createdAt: string }[],
  days: number,
  now: number,
): GrowthPoint[] {
  const end = dayKey(now);
  const start = end - (days - 1) * DAY;
  const perDay = new Map<number, number>();
  let before = 0;
  for (const user of users) {
    const t = new Date(user.createdAt).getTime();
    if (!Number.isFinite(t)) continue;
    const key = dayKey(t);
    if (key < start) before += 1;
    else perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  let total = before;
  const points: GrowthPoint[] = [];
  for (let day = start; day <= end; day += DAY) {
    const signups = perDay.get(day) ?? 0;
    total += signups;
    points.push({ day, signups, total });
  }
  return points;
}

/** Percent change of signups in the last `window` days vs the window before. */
export function signupTrend(points: GrowthPoint[], window = 7): number | null {
  const recent = points.slice(-window).reduce((s, p) => s + p.signups, 0);
  const previous = points
    .slice(-window * 2, -window)
    .reduce((s, p) => s + p.signups, 0);
  if (previous === 0) return recent > 0 ? 100 : null;
  return ((recent - previous) / previous) * 100;
}

export type VolumePoint = { day: number; volume: number };

/** Sums daily quote volume (volume × close) across symbols. */
export function buildDailyVolume(
  series: (MarketData[] | undefined)[],
): VolumePoint[] {
  const perDay = new Map<number, number>();
  for (const candles of series) {
    for (const c of candles ?? []) {
      const key = dayKey(c.time * 1000);
      perDay.set(
        key,
        (perDay.get(key) ?? 0) + Number(c.volume) * Number(c.close),
      );
    }
  }
  return Array.from(perDay.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, volume]) => ({ day, volume }));
}
