/**
 * Approximate equity curve = Σ(current amount × historical close) + cash.
 *
 * This assumes today's holdings over the whole range (no trade history yet).
 * Replace with backend equity snapshots / fills-based reconstruction (2.3).
 */
import type { MarketData } from "@/modules/market/types/market-data";
import type { Holding } from "./valuation";

export type EquityRange = "24H" | "7D" | "30D" | "90D";

export const EQUITY_RANGES: Record<
  EquityRange,
  { interval: string; limit: number }
> = {
  "24H": { interval: "15m", limit: 96 },
  "7D": { interval: "1h", limit: 168 },
  "30D": { interval: "4h", limit: 180 },
  "90D": { interval: "1d", limit: 90 },
};

export type EquityPoint = { time: number; equity: number };

export function buildEquityCurve(
  holdings: Holding[],
  candlesBySymbol: Record<string, MarketData[] | undefined>,
): EquityPoint[] {
  const cash = holdings
    .filter((h) => h.symbol == null)
    .reduce((s, h) => s + h.valueUsd, 0);
  const priced = holdings.filter((h) => h.symbol != null);
  const times = new Set<number>();
  const closes = new Map<string, Map<number, number>>();

  for (const holding of priced) {
    const series = new Map<number, number>();
    for (const candle of candlesBySymbol[holding.symbol!] ?? []) {
      series.set(candle.time, candle.close);
      times.add(candle.time);
    }
    closes.set(holding.symbol!, series);
  }

  const sorted = Array.from(times).sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  // Forward-fill each asset's last known close so gaps don't dip the curve.
  const last = new Map<string, number>();
  return sorted.map((time) => {
    let equity = cash;
    for (const holding of priced) {
      const close = closes.get(holding.symbol!)?.get(time);
      if (close != null) last.set(holding.symbol!, close);
      const price = last.get(holding.symbol!) ?? holding.price ?? 0;
      equity += holding.amount * price;
    }
    return { time, equity };
  });
}
