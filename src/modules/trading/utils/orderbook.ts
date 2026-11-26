import { floorToStep } from "@/lib/utils/decimal";
import { decimalsFromIncrement } from "@/lib/utils/precision";

export type BookLevel = {
  /** Grouped price as a fixed-decimal string (stable React key). */
  price: string;
  priceNum: number;
  size: number;
  total: number;
};

export type BookSide = "bid" | "ask";

/** Price grouping options: tick × 1, 10, 100, 1000 (based on instrument tick). */
export function groupingOptions(tick: string | undefined): string[] {
  const base = Number(tick) > 0 ? Number(tick) : 0.01;
  const decimals = decimalsFromIncrement(tick, 2);
  return [1, 10, 100, 1000].map((m) => {
    const step = base * m;
    return step.toFixed(Math.max(0, decimals - Math.round(Math.log10(m))));
  });
}

function roundToStep(price: number, step: number, side: BookSide) {
  const ratio = price / step;
  // Small epsilon avoids 0.1+0.2 style drift pushing values into the next bucket.
  const bucket =
    side === "bid" ? Math.floor(ratio + 1e-9) : Math.ceil(ratio - 1e-9);
  return bucket * step;
}

/**
 * Groups raw `[price, size]` levels by `step`, keeps the best `depth`
 * buckets and adds cumulative totals. Bids sorted desc, asks asc.
 */
export function buildBookSide(
  levels: [string, string][],
  side: BookSide,
  step: string,
  depth: number,
): BookLevel[] {
  const stepNum = Number(step) > 0 ? Number(step) : 0;
  const decimals = decimalsFromIncrement(step, 2);
  const buckets = new Map<number, number>();

  for (const [rawPrice, rawSize] of levels) {
    const price = Number(rawPrice);
    const size = Number(rawSize);
    if (!Number.isFinite(price) || !Number.isFinite(size) || size <= 0) continue;
    const key = stepNum > 0 ? roundToStep(price, stepNum, side) : price;
    const rounded = Number(key.toFixed(decimals));
    buckets.set(rounded, (buckets.get(rounded) ?? 0) + size);
  }

  const sorted = Array.from(buckets.entries()).sort((a, b) =>
    side === "bid" ? b[0] - a[0] : a[0] - b[0],
  );

  let total = 0;
  return sorted.slice(0, depth).map(([priceNum, size]) => {
    total += size;
    return { price: priceNum.toFixed(decimals), priceNum, size, total };
  });
}

export function spreadInfo(bestBid?: number, bestAsk?: number) {
  if (bestBid == null || bestAsk == null || bestAsk <= 0) return null;
  const spread = bestAsk - bestBid;
  const mid = (bestAsk + bestBid) / 2;
  return { spread, mid, spreadPct: mid > 0 ? (spread / mid) * 100 : 0 };
}

export type FillEstimate = {
  baseQty: number;
  quoteCost: number;
  avgPrice: number;
  /** True when the visible book can't absorb the whole order. */
  insufficientLiquidity: boolean;
};

/** Walks opposite-side levels to estimate a market order filled by base quantity. */
export function estimateFillByBase(
  levels: [string, string][],
  baseQty: number,
): FillEstimate {
  let remaining = baseQty;
  let cost = 0;
  for (const [p, s] of levels) {
    if (remaining <= 0) break;
    const price = Number(p);
    const take = Math.min(remaining, Number(s));
    cost += take * price;
    remaining -= take;
  }
  const filled = baseQty - Math.max(remaining, 0);
  return {
    baseQty: filled,
    quoteCost: cost,
    avgPrice: filled > 0 ? cost / filled : 0,
    insufficientLiquidity: remaining > 1e-12,
  };
}

/** Walks asks to estimate how much base a quote budget buys. */
export function estimateFillByQuote(
  asks: [string, string][],
  quoteBudget: number,
): FillEstimate {
  let budget = quoteBudget;
  let base = 0;
  for (const [p, s] of asks) {
    if (budget <= 0) break;
    const price = Number(p);
    const size = Number(s);
    if (price <= 0) continue;
    const take = Math.min(size, budget / price);
    base += take;
    budget -= take * price;
  }
  const spent = quoteBudget - Math.max(budget, 0);
  return {
    baseQty: base,
    quoteCost: spent,
    avgPrice: base > 0 ? spent / base : 0,
    insufficientLiquidity: budget > 1e-9,
  };
}

/** Floors `value` to a multiple of `increment` (exact decimal), returned as a fixed string. */
export function floorToIncrement(value: number | string, increment: string): string {
  return floorToStep(value, increment);
}
