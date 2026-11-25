/**
 * Derived market summaries.
 *
 * Today the backend only has a per-symbol ticker + candles, so 24h stats fall
 * back to 1h candles and sparklines are built from 7d of 1h closes. When the
 * live ticker stream (backend 2.2) lands, feed it into `buildMarketSummary`
 * (or replace `useMarketSummaries`) — consumers only see `MarketSummary`.
 */
import type { MarketData } from "@/modules/market/types/market-data";
import type { TickerDto } from "@/types/api.types";

export type MarketSummary = {
  symbol: string;
  base: string;
  quote: string;
  last: number | null;
  change24h: number | null;
  changePct24h: number | null;
  high24h: number | null;
  low24h: number | null;
  /** Base-asset volume. */
  volume24h: number | null;
  /** Approximate quote volume (volume × last). */
  quoteVolume24h: number | null;
  /** Closes for the sparkline (oldest → newest). */
  sparkline: number[];
  source: "ticker" | "candles" | "none";
};

const num = (value: string | number | undefined | null) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export function buildMarketSummary(
  symbol: string,
  ticker: TickerDto | null | undefined,
  candles: MarketData[] | undefined,
): MarketSummary {
  const [base = symbol, quote = "USD"] = symbol.split("-");
  const sorted = (candles ?? []).slice().sort((a, b) => a.time - b.time);
  const sparkline = sorted.map((c) => c.close);
  const lastDay = sorted.slice(-24);

  let last = num(ticker?.lastPrice);
  let change = num(ticker?.priceChange24h);
  let high = num(ticker?.high24h);
  let low = num(ticker?.low24h);
  let volume = num(ticker?.volume24h);
  let source: MarketSummary["source"] = ticker ? "ticker" : "none";

  if (lastDay.length > 0) {
    const close = lastDay.at(-1)!.close;
    const open = lastDay[0]!.open;
    if (last == null) {
      last = close;
      source = "candles";
    }
    if (!ticker) {
      change = close - open;
      high = Math.max(...lastDay.map((c) => c.high));
      low = Math.min(...lastDay.map((c) => c.low));
      volume = lastDay.reduce((sum, c) => sum + c.volume, 0);
    }
  }

  const open24h = last != null && change != null ? last - change : null;
  return {
    symbol,
    base,
    quote,
    last,
    change24h: change,
    changePct24h:
      open24h && change != null && open24h !== 0 ? (change / open24h) * 100 : null,
    high24h: high,
    low24h: low,
    volume24h: volume,
    quoteVolume24h: volume != null && last != null ? volume * last : null,
    sparkline,
    source,
  };
}
