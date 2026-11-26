/**
 * Derived market summaries.
 *
 * 24h stats come from the live ticker stream (Socket.IO `tickers`); 1h
 * candles are only a fallback and the source of the 7d sparkline.
 */
import type { MarketData } from "@/modules/market/types/market-data";
import type { MarketTickerDto } from "@/types/api.types";

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
  ticker: MarketTickerDto | null | undefined,
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

  const open24h =
    num(ticker?.open24h) ?? (last != null && change != null ? last - change : null);
  const tickerPct = num(ticker?.priceChangePercent24h);
  const tickerQuoteVolume = num(ticker?.quoteVolume24h);
  return {
    symbol,
    base,
    quote,
    last,
    change24h: change,
    changePct24h:
      ticker && tickerPct != null
        ? tickerPct
        : open24h && change != null && open24h !== 0
          ? (change / open24h) * 100
          : null,
    high24h: high,
    low24h: low,
    volume24h: volume,
    quoteVolume24h:
      tickerQuoteVolume && tickerQuoteVolume > 0
        ? tickerQuoteVolume
        : volume != null && last != null
          ? volume * last
          : null,
    sparkline,
    source,
  };
}
